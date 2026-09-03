import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  FileVideo,
  ImageOff,
  Images,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import {
  ApiError,
  deleteMedia,
  fetchMediaLibrary,
  mediaAccept,
  uploadMedia,
} from '@/lib/api'
import type { MediaFile } from '@/lib/api'
import { isVideoSrc, videoStillSrc } from '@/lib/site-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Everything uploaded through the admin page, shared by every field. */
export const mediaQueryKey = ['media'] as const

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} م.ب`
  return `${Math.max(1, Math.round(bytes / 1024))} ك.ب`
}

/**
 * Renders whatever a stored media URL points at. Projects and settings hold
 * one URL each, so the tag to use is decided from the path.
 */
export function MediaPreview({
  src,
  className,
  alt = 'معاينة',
  controls = true,
}: {
  src: string
  className?: string
  alt?: string
  controls?: boolean
}) {
  const [failed, setFailed] = useState(false)

  // A different file deserves a fresh attempt, even after a failure.
  useEffect(() => setFailed(false), [src])

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 border border-dashed text-sm text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-4" />
        تعذر تحميل الملف من المسار ده
      </div>
    )
  }

  if (isVideoSrc(src)) {
    return (
      <video
        key={src}
        // Nothing here autoplays, so seek slightly in for a visible frame.
        src={videoStillSrc(src)}
        controls={controls}
        muted
        playsInline
        preload="metadata"
        className={cn('bg-ink', className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Picks the image or video for one field: upload from the device (button or
 * drag and drop), reuse something already uploaded, or paste a URL. All three
 * end up as the same thing — a path stored on the project or the settings.
 */
export function MediaField({
  id,
  label,
  value,
  onChange,
  hint,
  required = false,
  previewClassName = 'aspect-[16/9] w-full rounded-lg object-cover',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  required?: boolean
  previewClassName?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const uploading = progress !== null
  const trimmed = value.trim()

  async function upload(file: File) {
    setError(null)
    setProgress(0)
    try {
      const uploaded = await uploadMedia(file, setProgress)
      onChange(uploaded.url)
      queryClient.invalidateQueries({ queryKey: mediaQueryKey })
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError ? uploadError.message : 'تعذر رفع الملف',
      )
    } finally {
      setProgress(null)
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void upload(file)
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${id}-url`}>{label}</Label>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'grid gap-3 rounded-xl border border-dashed p-3 transition-colors',
          dragging && 'border-primary bg-primary/5',
        )}
      >
        {trimmed ? (
          <MediaPreview src={trimmed} className={previewClassName} />
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/40 text-center text-sm text-muted-foreground',
              previewClassName,
            )}
          >
            <Upload className="size-5" />
            اسحب صورة أو فيديو هنا
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/*
            Every button here is type="button": the field lives inside the
            project form, where the default type would submit it.
          */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? 'جارٍ الرفع…' : 'رفع من الجهاز'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLibraryOpen(true)}
          >
            <Images className="size-4" />
            من المرفوع سابقًا
          </Button>

          {trimmed ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
            >
              <X className="size-4" />
              إزالة
            </Button>
          ) : null}
        </div>

        {uploading ? (
          <div className="grid gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              جارٍ الرفع… {progress}%
            </p>
          </div>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept={mediaAccept}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            // Reset first, so re-picking the same file still fires a change.
            event.target.value = ''
            if (file) void upload(file)
          }}
        />
      </div>

      {/*
        The path stays editable: an external link still works, and after an
        upload this shows where the file landed.
      */}
      <Input
        id={`${id}-url`}
        dir="ltr"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="/media/post4.png أو https://..."
      />

      {hint ? (
        <p className="m-0 text-xs leading-6 text-muted-foreground">{hint}</p>
      ) : null}

      {error ? (
        <p className="m-0 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onPick={(file) => {
          onChange(file.url)
          setLibraryOpen(false)
        }}
      />
    </div>
  )
}

/** Browse, reuse, and clean up files already on the server. */
export function MediaLibraryDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick?: (file: MediaFile) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            الملفات المرفوعة
          </DialogTitle>
          <DialogDescription>
            اختر ملف اترفع قبل كده بدل ما ترفعه تاني.
          </DialogDescription>
        </DialogHeader>
        <MediaLibrary onPick={onPick} />
      </DialogContent>
    </Dialog>
  )
}

export function MediaLibrary({
  onPick,
}: {
  onPick?: (file: MediaFile) => void
}) {
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const { data, isPending, error } = useQuery({
    queryKey: mediaQueryKey,
    queryFn: fetchMediaLibrary,
  })

  const remove = useMutation({
    mutationFn: deleteMedia,
    onSettled: () => {
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: mediaQueryKey })
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        جارٍ التحميل…
      </div>
    )
  }

  if (error) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        {error instanceof ApiError ? error.message : 'تعذر تحميل الملفات'}
      </p>
    )
  }

  if (!data.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        لسه مفيش ملفات مرفوعة. ارفع صورة أو فيديو من أي حقل وسائط.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {data.map((file) => (
        <div key={file.name} className="overflow-hidden rounded-lg border">
          {/*
            Videos show a still frame rather than a player here — the grid is
            for choosing a file, not for watching it.
          */}
          <MediaPreview
            src={file.url}
            controls={false}
            className="aspect-square w-full bg-muted object-cover"
          />
          <div className="flex items-center justify-between gap-1 p-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {file.kind === 'video' ? (
                <FileVideo className="size-3.5" />
              ) : null}
              {formatSize(file.size)}
            </span>
            <span className="flex items-center gap-1">
              {onPick ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onPick(file)}
                >
                  اختيار
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={remove.isPending && pendingDelete === file.name}
                onClick={() => {
                  setPendingDelete(file.name)
                  remove.mutate(file.name)
                }}
              >
                {remove.isPending && pendingDelete === file.name ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </Button>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
