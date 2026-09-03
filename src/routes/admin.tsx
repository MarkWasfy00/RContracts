import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'

import {
  ApiError,
  createProject,
  deleteProject,
  fetchAuthRequired,
  fetchSettings,
  getAdminToken,
  resetAllContent,
  setAdminToken,
  updateProject,
  updateSettings,
  verifyAdminToken,
} from '@/lib/api'
import {
  categoryLabel,
  projectCategories,
} from '@/lib/site-data'
import {
  MediaField,
  MediaLibrary,
  MediaPreview,
} from '@/components/media-field'
import type { Project, SiteSettings } from '@/lib/site-data'
import { projectsQueryKey, settingsQueryKey, useProjects } from '@/lib/queries'
import { useDocumentMeta } from '@/lib/seo'
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
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/admin')({ component: AdminPage })

function AdminPage() {
  useDocumentMeta({ title: 'لوحة التحكم' })


  // Stay on 'checking' until the server has told us whether a key is needed
  // and whether the saved one still works. Skipping that check would drop you
  // into the dashboard with a stale key and fail on the first save instead.
  const [state, setState] = useState<'checking' | 'locked' | 'unlocked'>(
    'checking',
  )
  // False when the server runs without ADMIN_TOKEN: there is no session to
  // end, so the dashboard hides its logout button.
  const [gated, setGated] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        if (!(await fetchAuthRequired())) {
          // Server started without ADMIN_TOKEN — there is nothing to log into.
          if (!cancelled) setState('unlocked')
          return
        }
        setGated(true)
        const saved = getAdminToken()
        if (!saved) {
          if (!cancelled) setState('locked')
          return
        }
        await verifyAdminToken(saved)
        if (!cancelled) setState('unlocked')
      } catch (error) {
        // A key the server rejected is worth forgetting. A server that is
        // simply unreachable is not — keep it and let them retry.
        if (error instanceof ApiError && error.status === 401) setAdminToken('')
        if (!cancelled) setState('locked')
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    )
  }

  if (state === 'locked') {
    return <LoginScreen onUnlocked={() => setState('unlocked')} />
  }

  return (
    <AdminDashboard
      onLogout={
        gated
          ? () => {
              setAdminToken('')
              setState('locked')
            }
          : undefined
      }
    />
  )
}

function LoginScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const candidate = key.trim()
    if (!candidate || checking) return

    setChecking(true)
    setError(null)
    try {
      await verifyAdminToken(candidate)
      setAdminToken(candidate)
      onUnlocked()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'مفتاح الإدارة غير صحيح'
          : err instanceof Error
            ? err.message
            : 'حصل خطأ غير متوقع',
      )
      setKey('')
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img
            src="/media/logo.jpg"
            alt="شعار RG"
            className="size-14 rounded-xl object-cover ring-1 ring-primary/40"
          />
          <div>
            <h1 className="font-display text-xl font-extrabold text-primary">
              لوحة التحكم
            </h1>
            <p className="mt-1 text-[11px] font-bold tracking-wide text-muted-foreground">
              RG GENERAL CONTRACTS
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="grid gap-4 rounded-2xl border bg-card p-6"
        >
          <div className="grid gap-2">
            <Label htmlFor="admin-key" className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              مفتاح الإدارة
            </Label>
            <Input
              id="admin-key"
              type="password"
              dir="ltr"
              autoFocus
              autoComplete="current-password"
              value={key}
              onChange={(event) => {
                setError(null)
                setKey(event.target.value)
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm leading-6">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="m-0">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={!key.trim() || checking}>
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            دخول
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-bold text-muted-foreground hover:text-primary"
          >
            رجوع للموقع
          </Link>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/media/logo.jpg"
              alt="شعار RG"
              className="size-10 rounded-lg object-cover ring-1 ring-primary/40"
            />
            <div className="leading-tight">
              <div className="font-display font-extrabold text-primary">
                لوحة التحكم
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                RG GENERAL CONTRACTS
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">
                <ExternalLink className="size-4" />
                عرض الموقع
              </Link>
            </Button>
            {onLogout && (
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="size-4" />
                خروج
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ConnectionStatus />

        <Tabs defaultValue="projects">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">المشاريع</TabsTrigger>
            <TabsTrigger value="settings">محتوى الصفحة</TabsTrigger>
            <TabsTrigger value="media">الملفات</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectsManager />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsManager />
          </TabsContent>
          <TabsContent value="media">
            <MediaManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

/* ── Shared ────────────────────────────────────────────────────── */

/** Renders a mutation/query error, with a hint when it's an auth failure. */
function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null
  const message =
    error instanceof Error ? error.message : 'حصل خطأ غير متوقع'
  const isAuth = error instanceof ApiError && error.status === 401

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm leading-7">
      <AlertCircle className="mt-1 size-4 shrink-0 text-destructive" />
      <p className="m-0">
        {message}
        {isAuth && ' — اضغط خروج وسجّل الدخول تاني.'}
      </p>
    </div>
  )
}

function ConnectionStatus() {
  const { isPending, isError, error } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
  })

  if (isPending) {
    return (
      <div className="mb-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        جارٍ الاتصال بالخادم…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-7">
        <AlertCircle className="mt-1 size-4 shrink-0 text-destructive" />
        <p className="m-0">
          <b>مفيش اتصال بالـ API.</b>{' '}
          {error instanceof Error ? error.message : ''} شغّل الخادم بالأمر{' '}
          <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">
            npm run dev:api
          </code>{' '}
          وجرب تاني.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
      <CheckCircle2 className="size-4 shrink-0 text-primary" />
      <p className="m-0">
        متصل بالخادم — كل التعديلات بتتحفظ في قاعدة البيانات مباشرة.
      </p>
    </div>
  )
}

/* ── Projects ──────────────────────────────────────────────────── */

const emptyProjectForm = {
  title: '',
  description: '',
  image: '',
  category: projectCategories[0].value as string,
  tags: '',
}

type ProjectFormState = typeof emptyProjectForm

function toFormState(project: Project): ProjectFormState {
  return {
    title: project.title,
    description: project.description,
    image: project.image,
    category: project.category,
    tags: project.tags.join('، '),
  }
}

function fromFormState(form: ProjectFormState): Omit<Project, 'id'> {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    category: form.category as Project['category'],
    tags: form.tags
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean),
  }
}

function ProjectsManager() {
  const projects = useProjects()
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: projectsQueryKey })

  const [editing, setEditing] = useState<Project | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      invalidate()
      setAdding(false)
    },
  })
  const updateMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      invalidate()
      setEditing(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="m-0 text-sm text-muted-foreground">
          {projects.length} مشروع معروض في البورتفوليو
        </p>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          أضف مشروع
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="gap-0 overflow-hidden py-0">
            <MediaPreview
              src={project.image}
              alt={project.title}
              controls={false}
              className="aspect-[16/9] w-full object-cover"
            />
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display font-extrabold">
                    {project.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">
                    {project.description}
                  </div>
                </div>
                <Badge variant="outline">{categoryLabel(project.category)}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="muted">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="تعديل"
                    onClick={() => setEditing(project)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="حذف"
                    className="border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10"
                    onClick={() => setDeleting(project)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add */}
      <ProjectFormDialog
        open={adding}
        onOpenChange={setAdding}
        title="إضافة مشروع جديد"
        initial={emptyProjectForm}
        pending={createMutation.isPending}
        error={createMutation.error}
        onSubmit={(form) => createMutation.mutate(fromFormState(form))}
      />

      {/* Edit */}
      <ProjectFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title="تعديل المشروع"
        initial={editing ? toFormState(editing) : emptyProjectForm}
        pending={updateMutation.isPending}
        error={updateMutation.error}
        onSubmit={(form) => {
          if (editing) {
            updateMutation.mutate({ ...fromFormState(form), id: editing.id })
          }
        }}
      />

      {/* Delete confirm */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف المشروع؟</DialogTitle>
            <DialogDescription className="leading-7">
              هيتم حذف «{deleting?.title}» من البورتفوليو. القرار ده مينفعش
              يترجع فيه.
            </DialogDescription>
          </DialogHeader>
          <ErrorNote error={deleteMutation.error} />
          <div className="flex justify-start gap-2">
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              <Trash2 className="size-4" />
              نعم، احذف
            </Button>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  pending,
  error,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  initial: ProjectFormState
  pending: boolean
  error: unknown
  onSubmit: (form: ProjectFormState) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            بيانات المشروع كما هتظهر في قسم «أعمالنا».
          </DialogDescription>
        </DialogHeader>
        {/* key remounts the form so fields reset per project */}
        {open && (
          <ProjectFormFields
            key={JSON.stringify(initial)}
            initial={initial}
            pending={pending}
            error={error}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProjectFormFields({
  initial,
  pending,
  error,
  onSubmit,
}: {
  initial: ProjectFormState
  pending: boolean
  error: unknown
  onSubmit: (form: ProjectFormState) => void
}) {
  const [form, setForm] = useState(initial)
  const set = (patch: Partial<ProjectFormState>) =>
    setForm((f) => ({ ...f, ...patch }))

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="p-title">اسم المشروع</Label>
        <Input
          id="p-title"
          required
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="مثال: مطبخ مودرن — تشطيب كامل"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="p-desc">الوصف</Label>
        <Textarea
          id="p-desc"
          required
          rows={3}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="وصف قصير للمشروع وما تم تنفيذه"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="p-cat">التصنيف</Label>
          <NativeSelect
            id="p-cat"
            value={form.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            {projectCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-tags">وسوم (افصل بينها بفاصلة)</Label>
          <Input
            id="p-tags"
            value={form.tags}
            onChange={(e) => set({ tags: e.target.value })}
            placeholder="مطابخ، إضاءة مخفية"
          />
        </div>
      </div>

      <MediaField
        id="p-image"
        label="صورة أو فيديو المشروع"
        required
        value={form.image}
        onChange={(image) => set({ image })}
        hint="ارفع صورة (JPG/PNG/WebP/GIF) أو فيديو (MP4/WebM/MOV) من جهازك، أو حط رابط مباشر."
      />

      <ErrorNote error={error} />

      <div className="mt-2 flex gap-2">
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? 'جارٍ الحفظ…' : 'حفظ المشروع'}
        </Button>
      </div>
    </form>
  )
}

/* ── Media ─────────────────────────────────────────────────────── */

/**
 * The "الملفات" tab. Uploading happens inside the fields that need a file;
 * this is where the uploads are reviewed and the unused ones deleted.
 */
function MediaManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الصور والفيديوهات المرفوعة</CardTitle>
        <CardDescription>
          كل الملفات اللي اترفعت من لوحة التحكم. امسح اللي مش مستخدم — لكن خلي
          بالك إن حذف ملف مستخدم في مشروع هيخلي مكانه فاضي.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MediaLibrary />
      </CardContent>
    </Card>
  )
}

/* ── Settings ──────────────────────────────────────────────────── */

function SettingsManager() {
  const { data } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
  })

  if (!data) return null
  return <SettingsForm initial={data} />
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const set = (patch: Partial<SiteSettings>) => {
    setSaved(false)
    setForm((f) => ({ ...f, ...patch }))
  }

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      setSaved(true)
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetAllContent,
    onSuccess: () => {
      queryClient.invalidateQueries()
      setConfirmReset(false)
      // Remount the form with fresh defaults on next render
      window.location.reload()
    },
  })

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        saveMutation.mutate(form)
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>بيانات التواصل</CardTitle>
          <CardDescription>
            الأرقام والروابط المستخدمة في كل أزرار الموقع.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-phone">رقم الهاتف (أرقام فقط)</Label>
            <Input
              id="s-phone"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="01022641600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-phone-display">الرقم كما يظهر للزائر</Label>
            <Input
              id="s-phone-display"
              dir="ltr"
              value={form.phoneDisplay}
              onChange={(e) => set({ phoneDisplay: e.target.value })}
              placeholder="0102 264 1600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-wa">رقم واتساب (بكود الدولة، بدون +)</Label>
            <Input
              id="s-wa"
              dir="ltr"
              value={form.whatsapp}
              onChange={(e) => set({ whatsapp: e.target.value })}
              placeholder="201022641600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-scope">نطاق العمل</Label>
            <Input
              id="s-scope"
              value={form.workScope}
              onChange={(e) => set({ workScope: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-ig-url">رابط إنستجرام</Label>
            <Input
              id="s-ig-url"
              dir="ltr"
              value={form.instagramUrl}
              onChange={(e) => set({ instagramUrl: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-ig-handle">اسم حساب إنستجرام</Label>
            <Input
              id="s-ig-handle"
              dir="ltr"
              value={form.instagramHandle}
              onChange={(e) => set({ instagramHandle: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الواجهة الرئيسية</CardTitle>
          <CardDescription>
            أول حاجة بيشوفها الزائر — العنوان والوصف وصورة الخلفية.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="s-badge">الشارة فوق العنوان</Label>
            <Input
              id="s-badge"
              value={form.heroBadge}
              onChange={(e) => set({ heroBadge: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="s-hero-title">العنوان الرئيسي</Label>
              <Input
                id="s-hero-title"
                value={form.heroTitle}
                onChange={(e) => set({ heroTitle: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-hero-highlight">
                الجزء المميز باللون الذهبي
              </Label>
              <Input
                id="s-hero-highlight"
                value={form.heroHighlight}
                onChange={(e) => set({ heroHighlight: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-hero-sub">الوصف</Label>
            <Textarea
              id="s-hero-sub"
              rows={3}
              value={form.heroSubtitle}
              onChange={(e) => set({ heroSubtitle: e.target.value })}
            />
          </div>
          <MediaField
            id="s-hero-image"
            label="خلفية الهيرو (صورة أو فيديو)"
            value={form.heroImage}
            onChange={(heroImage) => set({ heroImage })}
            hint="الفيديو بيشتغل تلقائي وبدون صوت كخلفية للقسم الأول."
          />

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            {form.stats.map((stat, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3">
                <Label htmlFor={`s-stat-value-${index}`}>
                  إحصائية {index + 1}
                </Label>
                <Input
                  id={`s-stat-value-${index}`}
                  dir="ltr"
                  value={stat.value}
                  onChange={(e) =>
                    set({
                      stats: form.stats.map((s, i) =>
                        i === index ? { ...s, value: e.target.value } : s,
                      ),
                    })
                  }
                  placeholder="+120"
                />
                <Input
                  id={`s-stat-label-${index}`}
                  value={stat.label}
                  onChange={(e) =>
                    set({
                      stats: form.stats.map((s, i) =>
                        i === index ? { ...s, label: e.target.value } : s,
                      ),
                    })
                  }
                  placeholder="مشروع منفذ"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قسم «من نحن»</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="s-about-title">العنوان</Label>
              <Input
                id="s-about-title"
                value={form.aboutTitle}
                onChange={(e) => set({ aboutTitle: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-about-highlight">
                الجزء المميز باللون الذهبي
              </Label>
              <Input
                id="s-about-highlight"
                value={form.aboutHighlight}
                onChange={(e) => set({ aboutHighlight: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-about-text">النبذة</Label>
            <Textarea
              id="s-about-text"
              rows={4}
              value={form.aboutText}
              onChange={(e) => set({ aboutText: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-about-points">نقاط التميز (نقطة في كل سطر)</Label>
            <Textarea
              id="s-about-points"
              rows={5}
              value={form.aboutPoints.join('\n')}
              onChange={(e) =>
                set({
                  aboutPoints: e.target.value.split('\n'),
                })
              }
            />
          </div>
          <MediaField
            id="s-about-image"
            label="صورة أو فيديو القسم"
            value={form.aboutImage}
            onChange={(aboutImage) => set({ aboutImage })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="s-founder">اسم المؤسس</Label>
              <Input
                id="s-founder"
                value={form.founderName}
                onChange={(e) => set({ founderName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-founder-role">الصفة</Label>
              <Input
                id="s-founder-role"
                value={form.founderRole}
                onChange={(e) => set({ founderRole: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ErrorNote error={saveMutation.error} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={saveMutation.isPending}>
          <Save className="size-4" />
          {saveMutation.isPending ? 'جارٍ الحفظ…' : 'حفظ كل التعديلات'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
            <CheckCircle2 className="size-4" />
            تم الحفظ
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          className="ms-auto text-muted-foreground"
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw className="size-4" />
          استرجاع المحتوى الافتراضي
        </Button>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استرجاع المحتوى الافتراضي؟</DialogTitle>
            <DialogDescription className="leading-7">
              هيتم مسح كل التعديلات المحفوظة (المشاريع والمحتوى) والرجوع للنسخة
              الأصلية.
            </DialogDescription>
          </DialogHeader>
          <ErrorNote error={resetMutation.error} />
          <div className="flex justify-start gap-2">
            <Button
              variant="destructive"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              <RotateCcw className="size-4" />
              نعم، استرجع الافتراضي
            </Button>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
