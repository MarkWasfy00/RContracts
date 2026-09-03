import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Code2, HardHat, Menu, Phone, X } from 'lucide-react'

import { phoneTelHref } from '@/lib/site-data'
import { useSiteSettings } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/**
 * The header and footer links. Every destination is a section of the home
 * page, so each is a hash — `sectionHref` turns it into something that works
 * from whichever page is currently open.
 */
export const navLinks = [
  { hash: 'home', label: 'الرئيسية' },
  { hash: 'services', label: 'خدماتنا' },
  { hash: 'portfolio', label: 'أعمالنا' },
  { hash: 'about', label: 'من نحن' },
  { hash: 'contact', label: 'تواصل معنا' },
]

/** True while the home page is the one being displayed. */
function useOnHome(): boolean {
  return useRouterState({ select: (state) => state.location.pathname === '/' })
}

export function Instagram({ className }: { className?: string }) {
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

export function BrandMark({ className = 'size-11' }: { className?: string }) {
  return (
    <img
      src="/media/logo.jpg"
      alt="شعار RG"
      className={`${className} rounded-lg object-cover ring-1 ring-primary/40`}
    />
  )
}

/**
 * A link to a section of the home page.
 *
 * On the home page itself that is a plain in-page anchor. From anywhere else
 * it has to route home first, which `Link` does client-side — a bare
 * `<a href="/#about">` would reload the whole app instead.
 */
function SectionLink({
  hash,
  className,
  onClick,
  children,
}: {
  hash: string
  className?: string
  onClick?: () => void
  children: React.ReactNode
}) {
  const onHome = useOnHome()

  if (onHome) {
    return (
      <a href={`#${hash}`} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link to="/" hash={hash} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

export function Navbar() {
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
        <SectionLink
          hash="home"
          className="order-last flex items-center gap-3"
        >
          <span className="flex items-center gap-3" dir="ltr">
            <BrandMark className="size-10" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold tracking-wide text-primary">
                RG
              </span>
              <span className="block text-[11px] font-bold text-muted-foreground">
                GENERAL CONTRACTS
              </span>
            </span>
          </span>
        </SectionLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <SectionLink
              key={link.hash}
              hash={link.hash}
              className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </SectionLink>
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
            <SectionLink
              key={link.hash}
              hash={link.hash}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-3 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </SectionLink>
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

export function Footer() {
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
              <SectionLink
                key={link.hash}
                hash={link.hash}
                className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </SectionLink>
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
          <span className="flex items-center gap-1.5">
            <Code2 className="size-3.5 text-primary" />
            تطوير الموقع
            <a
              href="https://markwasfy00.xyz"
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="font-bold text-primary transition-colors hover:text-gold-deep hover:underline"
            >
              markwasfy00.xyz
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
