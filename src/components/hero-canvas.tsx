import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Hero background: an architect's line-drawing of a room that sketches
 * itself stroke-by-stroke in gold — walls, window, sofa, table, rug,
 * lamp, plant and dimension lines — rendered with a flat orthographic
 * "blueprint" look, plus a pulsing lamp glow, drifting dust and subtle
 * mouse parallax.
 *
 * Rendering notes:
 * - Each stroke is a THREE.Line with LineDashedMaterial; the draw-on
 *   effect animates dashSize from 0 to the stroke's full length.
 * - Pixel ratio capped at 2; the loop pauses when off-screen / hidden.
 * - With prefers-reduced-motion a single fully-drawn frame is rendered.
 */

const GOLD = '#e6c473'
const GOLD_DIM = '#8a7a4a'

interface Stroke {
  line: THREE.Line
  mat: THREE.LineDashedMaterial
  length: number
  delay: number
  duration: number
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

function v(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z)
}

/** Sampled ellipse on the floor plane (y up). */
function ellipse(
  cx: number,
  cz: number,
  rx: number,
  rz: number,
  y: number,
  segments = 40,
): Array<THREE.Vector3> {
  const pts: Array<THREE.Vector3> = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(v(cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz))
  }
  return pts
}

/** Quadratic bezier sample, for plant leaves. */
function curve(
  a: THREE.Vector3,
  ctrl: THREE.Vector3,
  b: THREE.Vector3,
  segments = 14,
): Array<THREE.Vector3> {
  const c = new THREE.QuadraticBezierCurve3(a, ctrl, b)
  return c.getPoints(segments)
}

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(238, 208, 130, 0.9)')
  g.addColorStop(0.4, 'rgba(238, 208, 130, 0.25)')
  g.addColorStop(1, 'rgba(238, 208, 130, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const room = new THREE.Group()
    // Center the room around the origin so parallax pivots feel natural
    room.position.set(-5, -2.4, -5)
    const pivot = new THREE.Group()
    pivot.add(room)
    scene.add(pivot)

    // Flat, isometric "drawing" look
    const FRUSTUM = 13.5
    const aspect = container.clientWidth / container.clientHeight
    const camera = new THREE.OrthographicCamera(
      (-FRUSTUM * aspect) / 2,
      (FRUSTUM * aspect) / 2,
      FRUSTUM / 2,
      -FRUSTUM / 2,
      0.1,
      100,
    )
    camera.position.set(14, 10, 14)
    camera.lookAt(0, 0.4, 0)

    // ------------------------------------------------------------------
    // Stroke builder
    // ------------------------------------------------------------------
    const strokes: Array<Stroke> = []
    const geometries: Array<THREE.BufferGeometry> = []

    function stroke(
      points: Array<THREE.Vector3>,
      delay: number,
      opacity = 0.85,
      color: string = GOLD,
    ) {
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      geometries.push(geo)
      let length = 0
      for (let i = 1; i < points.length; i++) {
        length += points[i].distanceTo(points[i - 1])
      }
      const mat = new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity,
        dashSize: reducedMotion ? length : 0.0001,
        gapSize: 1e6,
      })
      const line = new THREE.Line(geo, mat)
      line.computeLineDistances()
      line.visible = reducedMotion
      room.add(line)
      strokes.push({
        line,
        mat,
        length,
        delay,
        duration: Math.min(1.1, Math.max(0.35, length * 0.09)),
      })
    }

    // ------------------------------------------------------------------
    // The room drawing (10 x 10 floor, 6 high walls)
    // ------------------------------------------------------------------

    // Floor outline, then faint grid
    stroke(
      [v(0, 0, 0), v(10, 0, 0), v(10, 0, 10), v(0, 0, 10), v(0, 0, 0)],
      0.1,
      0.8,
    )
    for (let i = 2; i <= 8; i += 2) {
      stroke([v(i, 0, 0), v(i, 0, 10)], 0.35 + i * 0.05, 0.14, GOLD_DIM)
      stroke([v(0, 0, i), v(10, 0, i)], 0.45 + i * 0.05, 0.14, GOLD_DIM)
    }

    // Walls (back at z=0, left at x=0)
    stroke([v(0, 0, 0), v(0, 6, 0)], 0.7, 0.8)
    stroke([v(10, 0, 0), v(10, 6, 0)], 0.8, 0.8)
    stroke([v(0, 6, 0), v(10, 6, 0)], 0.95, 0.8)
    stroke([v(0, 0, 10), v(0, 6, 10)], 0.85, 0.8)
    stroke([v(0, 6, 0), v(0, 6, 10)], 1.05, 0.8)

    // Window on the left wall, with panes
    stroke(
      [v(0, 2.2, 3), v(0, 4.8, 3), v(0, 4.8, 7), v(0, 2.2, 7), v(0, 2.2, 3)],
      1.5,
      0.9,
    )
    stroke([v(0, 3.5, 3), v(0, 3.5, 7)], 1.9, 0.5)
    stroke([v(0, 2.2, 5), v(0, 4.8, 5)], 2.0, 0.5)

    // Two picture frames on the back wall
    stroke(
      [
        v(2.2, 3.4, 0),
        v(3.6, 3.4, 0),
        v(3.6, 4.6, 0),
        v(2.2, 4.6, 0),
        v(2.2, 3.4, 0),
      ],
      2.2,
      0.7,
    )
    stroke(
      [
        v(4.1, 3.1, 0),
        v(6.1, 3.1, 0),
        v(6.1, 4.9, 0),
        v(4.1, 4.9, 0),
        v(4.1, 3.1, 0),
      ],
      2.35,
      0.7,
    )

    // Rug (two ellipses)
    stroke(ellipse(5.4, 5.4, 2.9, 2.1, 0.02), 2.5, 0.5)
    stroke(ellipse(5.4, 5.4, 2.3, 1.6, 0.02), 2.7, 0.3)

    // Sofa against the back wall (x 3..7.4, depth to z=2.2)
    // seat slab
    stroke(
      [
        v(3, 0.9, 0.5),
        v(7.4, 0.9, 0.5),
        v(7.4, 0.9, 2.2),
        v(3, 0.9, 2.2),
        v(3, 0.9, 0.5),
      ],
      2.9,
      0.95,
    )
    stroke([v(3, 0, 2.2), v(3, 0.9, 2.2)], 3.1, 0.8)
    stroke([v(7.4, 0, 2.2), v(7.4, 0.9, 2.2)], 3.15, 0.8)
    stroke([v(3, 0, 2.2), v(7.4, 0, 2.2)], 3.2, 0.6)
    // backrest
    stroke([v(3, 0.9, 0.5), v(3, 2.3, 0.5)], 3.3, 0.9)
    stroke([v(7.4, 0.9, 0.5), v(7.4, 2.3, 0.5)], 3.35, 0.9)
    stroke([v(3, 2.3, 0.5), v(7.4, 2.3, 0.5)], 3.45, 0.95)
    // armrests
    stroke([v(3, 1.6, 0.5), v(3, 1.6, 2.2), v(3, 0.9, 2.2)], 3.55, 0.8)
    stroke([v(7.4, 1.6, 0.5), v(7.4, 1.6, 2.2), v(7.4, 0.9, 2.2)], 3.6, 0.8)
    // cushion split
    stroke([v(5.2, 0.9, 0.5), v(5.2, 0.9, 2.2)], 3.7, 0.5)

    // Coffee table (top + legs)
    stroke(
      [
        v(4.4, 0.85, 4.6),
        v(6.4, 0.85, 4.6),
        v(6.4, 0.85, 5.8),
        v(4.4, 0.85, 5.8),
        v(4.4, 0.85, 4.6),
      ],
      3.9,
      0.9,
    )
    stroke([v(4.5, 0, 4.7), v(4.5, 0.85, 4.7)], 4.05, 0.6)
    stroke([v(6.3, 0, 4.7), v(6.3, 0.85, 4.7)], 4.1, 0.6)
    stroke([v(6.3, 0, 5.7), v(6.3, 0.85, 5.7)], 4.15, 0.6)
    stroke([v(4.5, 0, 5.7), v(4.5, 0.85, 5.7)], 4.2, 0.6)

    // Floor lamp (base, pole, shade)
    const LX = 8.8
    const LZ = 1.6
    stroke(ellipse(LX, LZ, 0.45, 0.28, 0.02, 24), 4.3, 0.7)
    stroke([v(LX, 0, LZ), v(LX, 3.3, LZ)], 4.45, 0.9)
    stroke(
      [v(LX - 0.65, 3.3, LZ), v(LX - 0.3, 4.15, LZ), v(LX + 0.3, 4.15, LZ), v(LX + 0.65, 3.3, LZ), v(LX - 0.65, 3.3, LZ)],
      4.6,
      0.95,
    )

    // Plant (pot + leaves)
    const PX = 1.3
    const PZ = 8.4
    stroke(
      [v(PX - 0.45, 1.0, PZ), v(PX - 0.3, 0, PZ), v(PX + 0.3, 0, PZ), v(PX + 0.45, 1.0, PZ), v(PX - 0.45, 1.0, PZ)],
      4.75,
      0.85,
    )
    stroke(curve(v(PX, 1.0, PZ), v(PX - 0.9, 2.2, PZ), v(PX - 1.1, 3.0, PZ)), 4.9, 0.8)
    stroke(curve(v(PX, 1.0, PZ), v(PX + 0.1, 2.4, PZ), v(PX + 0.9, 3.1, PZ)), 5.0, 0.8)
    stroke(curve(v(PX, 1.0, PZ), v(PX + 0.6, 1.9, PZ + 0.2), v(PX + 0.2, 2.6, PZ + 0.5)), 5.1, 0.8)

    // Architect dimension line along the front edge, with end ticks
    stroke([v(0, 0, 11.2), v(10, 0, 11.2)], 5.3, 0.55)
    stroke([v(0, 0, 10.85), v(0, 0, 11.55)], 5.65, 0.55)
    stroke([v(10, 0, 10.85), v(10, 0, 11.55)], 5.7, 0.55)
    stroke([v(11.2, 0, 0), v(11.2, 0, 10)], 5.5, 0.55)
    stroke([v(10.85, 0, 0), v(11.55, 0, 0)], 5.75, 0.55)
    stroke([v(10.85, 0, 10), v(11.55, 0, 10)], 5.8, 0.55)

    // ------------------------------------------------------------------
    // Lamp glow + dust
    // ------------------------------------------------------------------
    const glowTex = makeGlowTexture()
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glow = new THREE.Sprite(glowMat)
    glow.position.set(LX, 3.8, LZ)
    glow.scale.setScalar(3.2)
    room.add(glow)

    const DUST = 160
    const dustPos = new Float32Array(DUST * 3)
    let seed = 11
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = rand() * 12 - 1
      dustPos[i * 3 + 1] = rand() * 7
      dustPos[i * 3 + 2] = rand() * 12 - 1
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({
      color: GOLD,
      size: 0.07,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    const dust = new THREE.Points(dustGeo, dustMat)
    room.add(dust)

    // ------------------------------------------------------------------
    // Animation
    // ------------------------------------------------------------------
    const mouse = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    const clock = new THREE.Clock()
    let frameId = 0
    let visible = true
    let pageVisible = document.visibilityState === 'visible'
    let running = false

    const GLOW_AT = 4.8

    const renderFrame = () => {
      const t = clock.getElapsedTime()

      for (const s of strokes) {
        const p = Math.min(1, Math.max(0, (t - s.delay) / s.duration))
        if (p <= 0) {
          s.line.visible = false
          continue
        }
        s.line.visible = true
        s.mat.dashSize = Math.max(0.0001, easeOutCubic(p) * s.length)
      }

      // Lamp warms up once drawn, then breathes
      const g = Math.min(1, Math.max(0, (t - GLOW_AT) / 1.2))
      glowMat.opacity = g * (0.5 + Math.sin(t * 1.6) * 0.12)

      // Dust drifts up and wraps
      const pos = dustGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < DUST; i++) {
        let y = pos.getY(i) + 0.006 + (i % 4) * 0.0015
        if (y > 7) y = 0
        pos.setY(i, y)
      }
      pos.needsUpdate = true

      // Gentle sway + mouse parallax
      const targetY = mouse.x * 0.09 + Math.sin(t * 0.18) * 0.03
      const targetX = mouse.y * 0.045
      pivot.rotation.y += (targetY - pivot.rotation.y) * 0.05
      pivot.rotation.x += (targetX - pivot.rotation.x) * 0.05

      renderer.render(scene, camera)
    }

    const loop = () => {
      renderFrame()
      frameId = requestAnimationFrame(loop)
    }

    const updateRunning = () => {
      const shouldRun = visible && pageVisible && !reducedMotion
      if (shouldRun && !running) {
        running = true
        clock.start()
        frameId = requestAnimationFrame(loop)
      } else if (!shouldRun && running) {
        running = false
        cancelAnimationFrame(frameId)
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      updateRunning()
    })
    io.observe(container)

    const onVisibility = () => {
      pageVisible = document.visibilityState === 'visible'
      updateRunning()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onResize = () => {
      const { clientWidth, clientHeight } = container
      const a = clientWidth / clientHeight
      camera.left = (-FRUSTUM * a) / 2
      camera.right = (FRUSTUM * a) / 2
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
      if (reducedMotion) renderer.render(scene, camera)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    if (reducedMotion) {
      glowMat.opacity = 0.45
      renderer.render(scene, camera)
    } else {
      updateRunning()
    }

    return () => {
      cancelAnimationFrame(frameId)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      for (const s of strokes) s.mat.dispose()
      for (const g2 of geometries) g2.dispose()
      glowTex.dispose()
      glowMat.dispose()
      dustGeo.dispose()
      dustMat.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // Fade the drawing behind the headline/buttons so text stays readable
  const mask =
    'radial-gradient(ellipse 52% 42% at 50% 44%, rgba(0,0,0,0.22) 32%, rgba(0,0,0,0.6) 58%, #000 78%)'

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
    />
  )
}
