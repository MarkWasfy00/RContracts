/**
 * Site content model + default content.
 * Defaults are used until the API/localStorage has saved data.
 */

export const projectCategories = [
  { value: 'kitchens', label: 'مطابخ' },
  { value: 'living', label: 'غرف معيشة' },
  { value: 'finishing', label: 'تشطيبات' },
  { value: 'bathrooms', label: 'حمامات' },
  { value: 'offices', label: 'مكاتب وتجاري' },
] as const

export type ProjectCategory = (typeof projectCategories)[number]['value']

export function categoryLabel(value: string): string {
  return (
    projectCategories.find((c) => c.value === value)?.label ?? value
  )
}

/**
 * Whether a stored media path points at a video rather than an image.
 *
 * Nothing records the type alongside the URL, so the renderer works it out
 * from the extension. Uploads are named by the server with an extension
 * matching the file's real type; a pasted external URL is judged the same
 * way, and anything unrecognised renders as an image.
 */
export function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(src.trim())
}

/**
 * The same video URL, nudged a fraction of a second in.
 *
 * A paused `<video>` renders black until the browser has decoded a frame,
 * which it won't do for `preload="metadata"` alone. The media fragment makes
 * it seek, so a video used as a thumbnail shows its opening frame.
 */
export function videoStillSrc(src: string): string {
  return src.includes('#') ? src : `${src}#t=0.1`
}

export interface Project {
  id: string
  /** Every image and video in the project's gallery, in display order. */
  media: Array<string>
  /** The one shown in cards and shared links. Never empty once stored. */
  cover: string
  title: string
  description: string
  category: ProjectCategory
  tags: Array<string>
  /** Older projects held a single file here. Read through `projectMedia`. */
  image?: string
}

/** Shown when a project somehow has no files at all. */
export const fallbackCover = '/media/post1.png'

/**
 * The cover to use when none was chosen: the first still image, falling back
 * to the first file of any kind. An image is preferred because a card and a
 * shared link can't render a frame out of a video on their own.
 */
export function defaultCover(media: Array<string>): string {
  return media.find((item) => !isVideoSrc(item)) ?? media[0] ?? ''
}

/**
 * A project's gallery. The server migrates the older single-`image` shape on
 * load, so this only matters for the defaults bundled with the client and for
 * a project being edited in the admin form.
 */
export function projectMedia(project: Project): Array<string> {
  if (project.media?.length) return project.media
  const legacy = project.image?.trim()
  return legacy ? [legacy] : []
}

/** What to show for a project in a card, a teaser, or a preview. */
export function projectCover(project: Project): string {
  return (
    project.cover?.trim() ||
    defaultCover(projectMedia(project)) ||
    fallbackCover
  )
}

export interface SiteSettings {
  /** Local phone digits, e.g. "01022641600" */
  phone: string
  phoneDisplay: string
  /** International WhatsApp digits without "+", e.g. "201022641600" */
  whatsapp: string
  instagramUrl: string
  instagramHandle: string
  heroBadge: string
  heroTitle: string
  heroHighlight: string
  heroSubtitle: string
  heroImage: string
  stats: Array<{ value: string; label: string }>
  aboutTitle: string
  aboutHighlight: string
  aboutText: string
  aboutPoints: Array<string>
  aboutImage: string
  founderName: string
  founderRole: string
  workScope: string
}

export function phoneTelHref(settings: SiteSettings): string {
  return `tel:+2${settings.phone}`
}

export function whatsappHref(settings: SiteSettings): string {
  return `https://wa.me/${settings.whatsapp}`
}

export const defaultProjects: Array<Project> = [
  {
    id: 'default-kitchen',
    media: ['/media/post3.png'],
    cover: '/media/post3.png',
    title: 'مطبخ مودرن — تشطيب كامل',
    description:
      'تشطيب مطبخ متكامل: خزائن حتى السقف، أسطح رخام، وكرانيش إضاءة مخفية مع تسليم كامل للأجهزة.',
    category: 'kitchens',
    tags: ['مطابخ', 'إضاءة مخفية', 'تسليم مفتاح'],
  },
  {
    id: 'default-living',
    media: ['/media/post1.png'],
    cover: '/media/post1.png',
    title: 'غرفة معيشة عملية',
    description:
      'استغلال ذكي للمساحة بدواليب حائط ووحدات تخزين مدمجة مع الحفاظ على الإضاءة الطبيعية.',
    category: 'living',
    tags: ['معيشة', 'استغلال مساحات'],
  },
  {
    id: 'default-renew',
    media: ['/media/post2.png'],
    cover: '/media/post2.png',
    title: 'تجديد مساحة معيشة',
    description:
      'تجديد ديكور بلمسات معدنية نحاسية، مرايا لإضافة عمق، ونباتات طبيعية تضفي حياة على المكان.',
    category: 'living',
    tags: ['ديكور', 'تجديد'],
  },
]

export const defaultSettings: SiteSettings = {
  phone: '01022641600',
  phoneDisplay: '0102 264 1600',
  whatsapp: '201022641600',
  instagramUrl: 'https://www.instagram.com/rg.generalcontracts',
  instagramHandle: '@rg.generalcontracts',
  heroBadge: 'مقاولات عامة · تشطيبات · ديكورات',
  heroTitle: 'بنحوّل مساحتك لمكان',
  heroHighlight: 'يليق بيك',
  heroSubtitle:
    'RG General Contracts — شركة مقاولات عامة وتشطيبات وديكورات. بننفذ مشروعك من أول التصميم لحد التسليم، بإشراف هندسي مباشر من م/ محمود الرويني.',
  heroImage: '/media/post3.png',
  stats: [
    { value: '+120', label: 'مشروع منفذ' },
    { value: '+10', label: 'سنوات خبرة' },
    { value: '%100', label: 'التزام بالتسليم' },
  ],
  aboutTitle: 'خبرة هندسية..',
  aboutHighlight: 'وذوق في التفاصيل',
  aboutText:
    'RG General Contracts شركة متخصصة في المقاولات العامة والتشطيبات والديكور. بنؤمن إن كل مساحة ليها إمكانيات، وشغلنا إننا نطلع أحسن ما فيها — بتخطيط هندسي سليم، وخامات مضمونة، وتنفيذ ملتزم.',
  aboutPoints: [
    'إشراف هندسي مباشر على كل مراحل التنفيذ',
    'عروض أسعار تفصيلية واضحة بدون تكاليف مخفية',
    'خامات مضمونة من موردين موثوقين',
    'التزام كامل بمواعيد التسليم المتفق عليها',
    'ضمان على جميع أعمال التشطيب',
  ],
  aboutImage: '/media/post2.png',
  founderName: 'م/ محمود الرويني',
  founderRole: 'المؤسس والمشرف الهندسي',
  workScope: 'جمهورية مصر العربية',
}
