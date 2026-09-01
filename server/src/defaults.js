/**
 * Seed content written to the database the first time the server runs.
 * After that the database is the source of truth — editing this file
 * only affects a fresh database (or a reset via POST /api/reset).
 *
 * Keep the category list in sync with `src/lib/site-data.ts` on the client.
 */

export const projectCategories = [
  'kitchens',
  'living',
  'finishing',
  'bathrooms',
  'offices',
]

export const defaultProjects = [
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

export const defaultSettings = {
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
