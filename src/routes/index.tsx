import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  DraftingCompass,
  HardHat,
  MapPin,
  Menu,
  PaintRoller,
  Phone,
  Ruler,
  Sofa,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  X,
} from 'lucide-react'

import {
  categoryLabel,
  phoneTelHref,
  projectCategories,
  whatsappHref,
} from '@/lib/site-data'
import type { Project } from '@/lib/site-data'
import { useProjects, useSiteSettings } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/')({ component: Home })

const navLinks = [
  { href: '#home', label: 'الرئيسية' },
  { href: '#services', label: 'خدماتنا' },
  { href: '#portfolio', label: 'أعمالنا' },
  { href: '#about', label: 'من نحن' },
  { href: '#contact', label: 'تواصل معنا' },
]

const services = [
  {
    icon: Building2,
    title: 'مقاولات عامة',
    description:
      'تنفيذ أعمال المقاولات من المحارة والأرضيات حتى التسليم النهائي بجودة والتزام.',
  },
  {
    icon: PaintRoller,
    title: 'تشطيبات متكاملة',
    description:
      'تشطيب شقق وفيلات ومكاتب تسليم مفتاح، بخامات مضمونة ومستويات تشطيب مختلفة.',
  },
  {
    icon: Sofa,
    title: 'تصميم داخلي وديكور',
    description:
      'تصميمات ديكور عصرية تستغل كل متر في مساحتك، بلمسات معدنية ومرايا ونباتات طبيعية.',
  },
  {
    icon: UtensilsCrossed,
    title: 'مطابخ ودريسنج روم',
    description:
      'تصميم وتنفيذ مطابخ ووحدات تخزين حتى السقف تستغل المساحة وتخدم استخدامك اليومي.',
  },
  {
    icon: Wrench,
    title: 'كهرباء وسباكة',
    description:
      'تأسيس وتعديل شبكات الكهرباء والسباكة بخامات موثوقة وأيدي فنية متخصصة.',
  },
  {
    icon: HardHat,
    title: 'إشراف هندسي',
    description:
      'متابعة هندسية يومية على كل مراحل التنفيذ بإشراف م/ محمود الرويني.',
  },
]

const processSteps = [
  {
    icon: Phone,
    title: 'استشارة ومعاينة',
    description: 'نسمع احتياجك ونعاين المكان على الطبيعة ونحدد نطاق الشغل.',
  },
  {
    icon: DraftingCompass,
    title: 'تصميم وعرض سعر',
    description: 'نقدم تصور كامل للتصميم مع عرض سعر تفصيلي واضح بدون مفاجآت.',
  },
  {
    icon: Ruler,
    title: 'تنفيذ بإشراف هندسي',
    description: 'فرق متخصصة لكل بند، ومتابعة هندسية يومية على الجودة.',
  },
  {
    icon: CheckCircle2,
    title: 'تسليم في الموعد',
    description: 'نسلّم في الميعاد المتفق عليه، ومعاك ضمان على الشغل.',
  },
]

const faqs = [
  {
    question: 'هل بتشتغلوا بنظام تسليم المفتاح؟',
    answer:
      'نعم، بننفذ تشطيبات كاملة تسليم مفتاح من التأسيس حتى الفرش النهائي، وكمان بننفذ بنود متفرقة حسب احتياجك.',
  },
  {
    question: 'إزاي بيتم تحديد السعر؟',
    answer:
      'بعد المعاينة بنقدم عرض سعر تفصيلي بكل بند وخاماته، وبنلتزم بيه طول فترة التنفيذ بدون تكاليف مفاجئة.',
  },
  {
    question: 'مين بيشرف على التنفيذ؟',
    answer:
      'كل مشاريعنا بتتنفذ بإشراف هندسي مباشر من م/ محمود الرويني وفريق هندسي متابع يوميًا على الموقع.',
  },
  {
    question: 'هل ممكن أشوف أعمال سابقة؟',
    answer:
      'أكيد، تقدر تتصفح قسم أعمالنا في الصفحة أو تتابع صفحتنا على إنستجرام حيث بننشر أحدث المشاريع أولاً بأول.',
  },
]

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <About />
        <Process />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

function Instagram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function BrandMark({ className = 'size-11' }: { className?: string }) {
  return (
    <img
      src="/media/logo.jpg"
      alt="شعار RG"
      className={`${className} rounded-lg object-cover ring-1 ring-primary/40`}
    />
  )
}

function Navbar() {
  const settings = useSiteSettings()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/*
          The brand sits on the visual left even though the page is RTL, so
          it is ordered last. Its contents are Latin text, hence the ltr
          direction inside.
        */}
        <a href="#home" className="order-last flex items-center gap-3" dir="ltr">
          <BrandMark className="size-10" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold tracking-wide text-primary">
              RG
            </span>
            <span className="block text-[11px] font-bold text-muted-foreground">
              GENERAL CONTRACTS
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="القائمة"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-background px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-3 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <Button asChild className="mt-2 w-full">
            <a href={phoneTelHref(settings)}>
              <Phone className="size-4" />
              {settings.phoneDisplay}
            </a>
          </Button>
        </nav>
      )}
    </header>
  )
}

function Hero() {
  const settings = useSiteSettings()

  return (
    <section id="home" className="relative overflow-hidden pt-16">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${settings.heroImage}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 md:py-32">
        <Badge variant="outline" className="mb-6 gap-2 px-4 py-1.5 text-sm">
          <Sparkles className="size-3.5" />
          {settings.heroBadge}
        </Badge>

        <h1 className="max-w-3xl text-4xl font-black leading-[1.3] sm:text-5xl md:text-6xl md:leading-[1.25]">
          {settings.heroTitle}{' '}
          <span className="text-primary">{settings.heroHighlight}</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          {settings.heroSubtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <a href="#portfolio">
              شاهد أعمالنا
              <ArrowLeft className="size-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={whatsappHref(settings)} target="_blank" rel="noreferrer">
              اطلب معاينة مجانية
            </a>
          </Button>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-4">
          {settings.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-card/60 px-4 py-5 backdrop-blur-sm"
            >
              <div className="font-display text-2xl font-black text-primary sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-bold text-muted-foreground sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <Badge variant="outline" className="mb-4">
        {eyebrow}
      </Badge>
      <h2 className="text-3xl font-black leading-snug sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 leading-8 text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function Services() {
  return (
    <section id="services" className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="خدماتنا"
          title="كل اللي مشروعك محتاجه في مكان واحد"
          description="من المقاولات العامة للتشطيبات والديكور — فريق واحد مسؤول عن مشروعك من الألف للياء."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service.title}
              className="group gap-4 transition-colors hover:border-primary/50"
            >
              <CardHeader>
                <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <service.icon className="size-6" />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-7">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border text-start transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-secondary/80">
                  {tag}
                </Badge>
              ))}
            </div>
            <h3 className="font-display text-lg font-extrabold text-cream">
              {project.title}
            </h3>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {project.title}
          </DialogTitle>
          <DialogDescription className="leading-7">
            {project.description}
          </DialogDescription>
        </DialogHeader>
        <img
          src={project.image}
          alt={project.title}
          className="w-full rounded-lg border"
        />
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InstagramCard() {
  const settings = useSiteSettings()

  return (
    <a
      href={settings.instagramUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-primary/40 bg-card/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Instagram className="size-7" />
      </div>
      <div>
        <div className="font-display text-lg font-extrabold">
          شاهد المزيد على إنستجرام
        </div>
        <div className="mt-1 text-sm text-muted-foreground" dir="ltr">
          {settings.instagramHandle}
        </div>
      </div>
      <Badge variant="outline">أحدث المشاريع أولاً بأول</Badge>
    </a>
  )
}

function Portfolio() {
  const projects = useProjects()

  const usedCategories = projectCategories.filter((cat) =>
    projects.some((p) => p.category === cat.value),
  )
  const filters = [
    { value: 'all', label: 'كل الأعمال' },
    ...usedCategories.map((cat) => ({
      value: cat.value as string,
      label: categoryLabel(cat.value),
    })),
  ]

  return (
    <section
      id="portfolio"
      className="scroll-mt-16 border-y bg-secondary/20 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="أعمالنا"
          title="مشاريع نفتخر بيها"
          description="نماذج من مشاريعنا المنفذة — اضغط على أي مشروع لعرض التفاصيل."
        />

        <Tabs defaultValue="all">
          <TabsList className="mx-auto mb-8">
            {filters.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {filters.map((filter) => {
            const items =
              filter.value === 'all'
                ? projects
                : projects.filter((p) => p.category === filter.value)
            return (
              <TabsContent key={filter.value} value={filter.value}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  {filter.value === 'all' && <InstagramCard />}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}

function About() {
  const settings = useSiteSettings()

  return (
    <section id="about" className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-2xl border">
            <img
              src={settings.aboutImage}
              alt="من أعمال RG General Contracts"
              loading="lazy"
              className="w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -end-3 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xl sm:-end-5">
            <BrandMark className="size-12" />
            <div>
              <div className="font-display text-sm font-extrabold">
                {settings.founderName}
              </div>
              <div className="text-xs text-muted-foreground">
                {settings.founderRole}
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Badge variant="outline" className="mb-4">
            من نحن
          </Badge>
          <h2 className="text-3xl font-black leading-snug sm:text-4xl">
            {settings.aboutTitle}{' '}
            <span className="text-primary">{settings.aboutHighlight}</span>
          </h2>
          <p className="mt-5 leading-8 text-muted-foreground">
            {settings.aboutText}
          </p>

          <ul className="mt-7 space-y-3.5">
            {settings.aboutPoints
              .filter((point) => point.trim())
              .map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="font-medium leading-7">{point}</span>
                </li>
              ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <a href="#contact">
                تواصل معنا
                <ArrowLeft className="size-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer">
                <Instagram className="size-4" />
                تابعنا على إنستجرام
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Process() {
  return (
    <section className="border-y bg-secondary/20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="طريقة شغلنا"
          title="من أول مكالمة لحد الاستلام"
          description="خطوات واضحة ومنظمة عشان تكون مطمّن في كل مرحلة من مراحل مشروعك."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <Card key={step.title} className="relative gap-3 overflow-hidden">
              <span
                className="pointer-events-none absolute -top-4 end-2 font-display text-7xl font-black text-primary/10"
                aria-hidden
              >
                {index + 1}
              </span>
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-7">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="أسئلة شائعة"
          title="عندك سؤال؟ غالبًا إجابته هنا"
        />
        <Accordion type="single" collapsible className="rounded-xl border bg-card px-6">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

function Contact() {
  const settings = useSiteSettings()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = encodeURIComponent(
      `مرحبًا، أنا ${name || 'عميل جديد'}\nرقم التواصل: ${phone}\n${message}`,
    )
    window.open(
      `${whatsappHref(settings)}?text=${text}`,
      '_blank',
      'noreferrer',
    )
  }

  return (
    <section
      id="contact"
      className="scroll-mt-16 border-t bg-secondary/20 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Badge variant="outline" className="mb-4">
            تواصل معنا
          </Badge>
          <h2 className="text-3xl font-black leading-snug sm:text-4xl">
            جاهزين نبدأ <span className="text-primary">مشروعك؟</span>
          </h2>
          <p className="mt-4 leading-8 text-muted-foreground">
            كلمنا أو ابعتلنا تفاصيل مشروعك، وهنرد عليك بمعاينة وعرض سعر تفصيلي.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href={phoneTelHref(settings)}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="size-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground">
                  اتصل بنا
                </div>
                <div className="font-display font-extrabold" dir="ltr">
                  {settings.phoneDisplay}
                </div>
              </div>
            </a>

            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Instagram className="size-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground">
                  إنستجرام
                </div>
                <div className="font-display font-extrabold" dir="ltr">
                  {settings.instagramHandle}
                </div>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground">
                  نطاق العمل
                </div>
                <div className="font-display font-extrabold">
                  {settings.workScope}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-xl">اطلب معاينة مجانية</CardTitle>
            <CardDescription>
              املأ البيانات وهيتم تحويلك للواتساب لإرسال طلبك مباشرة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكريم"
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    className="h-11 text-end"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">تفاصيل المشروع</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="مثال: شقة 150 متر محتاجة تشطيب كامل في التجمع الخامس..."
                />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-fit">
                إرسال عبر واتساب
                <ArrowLeft className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Footer() {
  const settings = useSiteSettings()

  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <BrandMark className="size-10" />
            <div>
              <div className="font-display font-extrabold text-primary">
                RG General Contracts
              </div>
              <div className="text-xs text-muted-foreground">
                مقاولات عامة · تشطيبات · ديكورات
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="إنستجرام"
              >
                <Instagram className="size-4" />
              </a>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={phoneTelHref(settings)} aria-label="اتصل بنا">
                <Phone className="size-4" />
              </a>
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground md:flex-row">
          <span>
            © {new Date().getFullYear()} RG General Contracts — جميع الحقوق
            محفوظة
          </span>
          <span className="flex items-center gap-1.5">
            <HardHat className="size-3.5 text-primary" />
            بإشراف {settings.founderName}
          </span>
        </div>
      </div>
    </footer>
  )
}
