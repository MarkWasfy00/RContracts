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

export interface Project {
  id: string
  image: string
  title: string
  description: string
  category: ProjectCategory
  tags: Array<string>
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
    image: '/media/post3.png',
    title: 'مطبخ مودرن — تشطيب كامل',
    description:
      'تشطيب مطبخ متكامل: خزائن حتى السقف، أسطح رخام، وكرانيش إضاءة مخفية مع تسليم كامل للأجهزة.',
    category: 'kitchens',
    tags: ['مطابخ', 'إضاءة مخفية', 'تسليم مفتاح'],
  },
  {
    id: 'default-living',
    image: '/media/post1.png',
    title: 'غرفة معيشة عملية',
    description:
      'استغلال ذكي للمساحة بدواليب حائط ووحدات تخزين مدمجة مع الحفاظ على الإضاءة الطبيعية.',
    category: 'living',
    tags: ['معيشة', 'استغلال مساحات'],
  },
  {
    id: 'default-renew',
    image: '/media/post2.png',
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
