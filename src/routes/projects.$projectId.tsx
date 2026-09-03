import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ChevronLeft, Loader2, Phone } from 'lucide-react'

import {
  categoryLabel,
  isVideoSrc,
  phoneTelHref,
  videoStillSrc,
  whatsappHref,
} from '@/lib/site-data'
import type { Project } from '@/lib/site-data'
import { useProject, useProjects, useSiteSettings } from '@/lib/queries'
import { metaDescription, useDocumentMeta } from '@/lib/seo'
import { Footer, Instagram, Navbar } from '@/components/site-chrome'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectPage,
})

function ProjectPage() {
  const { projectId } = Route.useParams()
  const { project, isPending } = useProject(projectId)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        {isPending ? (
          <ProjectPending />
        ) : project ? (
          <ProjectDetail project={project} />
        ) : (
          <ProjectMissing />
        )}
      </main>
      <Footer />
    </div>
  )
}

function ProjectPending() {
  useDocumentMeta({ title: 'جارٍ التحميل' })

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  )
}

function ProjectMissing() {
  useDocumentMeta({
    title: 'المشروع غير موجود',
    description: 'المشروع اللي بتدور عليه مش موجود أو اتشال من الموقع.',
  })

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-black">المشروع غير موجود</h1>
      <p className="m-0 leading-8 text-muted-foreground">
        يمكن يكون اتشال أو الرابط مش مظبوط. تقدر تتصفح باقي أعمالنا.
      </p>
      <Button asChild>
        <Link to="/" hash="portfolio">
          كل الأعمال
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

function ProjectDetail({ project }: { project: Project }) {
  const settings = useSiteSettings()

  useDocumentMeta({
    title: project.title,
    description: metaDescription(project.description),
  })

  return (
    <>
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <Breadcrumb title={project.title} />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{categoryLabel(project.category)}</Badge>
          {project.tags.map((tag) => (
            <Badge key={tag} variant="muted">
              {tag}
            </Badge>
          ))}
        </div>

        <h1 className="text-3xl font-black leading-[1.3] sm:text-4xl">
          {project.title}
        </h1>

        <div className="mt-8 overflow-hidden rounded-2xl border">
          {isVideoSrc(project.image) ? (
            <video
              // A visitor who opened this page came for the project itself,
              // so the video is ready to play rather than autoplaying at them.
              src={videoStillSrc(project.image)}
              controls
              playsInline
              preload="metadata"
              className="w-full bg-ink"
            />
          ) : (
            <img
              src={project.image}
              alt={project.title}
              className="w-full object-cover"
            />
          )}
        </div>

        <p className="mt-8 text-base leading-9 text-muted-foreground sm:text-lg">
          {project.description}
        </p>

        <div className="mt-10 rounded-2xl border bg-card p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-extrabold">
            عايز شغل زي ده في مكانك؟
          </h2>
          <p className="mx-auto mt-3 max-w-lg leading-8 text-muted-foreground">
            كلمنا وهنعاين المكان ونطلعلك عرض سعر تفصيلي واضح، بإشراف هندسي من{' '}
            {settings.founderName}.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <a href={whatsappHref(settings)} target="_blank" rel="noreferrer">
                اطلب معاينة مجانية
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={phoneTelHref(settings)}>
                <Phone className="size-4" />
                {settings.phoneDisplay}
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="إنستجرام"
              >
                <Instagram className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </article>

      <RelatedProjects current={project} />
    </>
  )
}

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav
      aria-label="مسار التنقل"
      className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
    >
      <Link to="/" className="font-bold hover:text-primary">
        الرئيسية
      </Link>
      <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
      <Link to="/" hash="portfolio" className="font-bold hover:text-primary">
        أعمالنا
      </Link>
      <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
      <span className="line-clamp-1 text-foreground">{title}</span>
    </nav>
  )
}

/**
 * Other work to look at next — same category first, topped up with anything
 * else so the section isn't empty for a one-of-a-kind project.
 */
function RelatedProjects({ current }: { current: Project }) {
  const projects = useProjects()

  const others = projects.filter((p) => p.id !== current.id)
  const sameCategory = others.filter((p) => p.category === current.category)
  const related = [
    ...sameCategory,
    ...others.filter((p) => p.category !== current.category),
  ].slice(0, 3)

  if (!related.length) return null

  return (
    <section className="border-t bg-secondary/20 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="m-0 font-display text-2xl font-extrabold">
            مشاريع تانية
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/" hash="portfolio">
              كل الأعمال
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((project) => (
            <ProjectTeaser key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectTeaser({ project }: { project: Project }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="group relative block overflow-hidden rounded-xl border transition-colors hover:border-primary/60"
    >
      {isVideoSrc(project.image) ? (
        <video
          src={videoStillSrc(project.image)}
          muted
          playsInline
          preload="metadata"
          className="aspect-[4/3] w-full bg-ink object-cover transition-transform duration-500 group-hover:scale-105"
          aria-hidden
        />
      ) : (
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <Separator className="mb-3 bg-primary/40" />
        <h3 className="font-display font-extrabold text-cream">
          {project.title}
        </h3>
      </div>
    </Link>
  )
}
