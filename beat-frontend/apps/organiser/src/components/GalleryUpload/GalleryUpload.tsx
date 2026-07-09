import { Input } from '@beat/ui'
import type { RefObject } from 'react'

export type GalleryImageItem = {
  id: string
  url: string
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

/** Presentational gallery upload — all state and validation live in the parent. */
export interface GalleryUploadProps {
  inputId: string
  inputRef: RefObject<HTMLInputElement>
  title: string
  description: string
  uploadLabel: string
  images: GalleryImageItem[]
  canAddMore: boolean
  error?: string | null
  accept?: string
  onOpenPicker: () => void
  onFilesSelected: (files: File[]) => void
  onRemoveImage: (id: string) => void
}

export function GalleryUpload({
  inputId,
  inputRef,
  title,
  description,
  uploadLabel,
  images,
  canAddMore,
  error,
  accept = 'image/jpeg,image/png,image/webp',
  onOpenPicker,
  onFilesSelected,
  onRemoveImage,
}: GalleryUploadProps) {
  return (
    <div className="w-full min-w-0 space-y-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? [])
          e.target.value = ''
          onFilesSelected(selected)
        }}
      />

      <div className="flex flex-wrap items-start gap-3">
        {canAddMore ? (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-border bg-card/40 p-2">
            <button
              type="button"
              onClick={onOpenPicker}
              className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
              {uploadLabel}
            </button>
          </div>
        ) : null}

        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border"
          >
            <img
              src={image.url}
              alt={`Gallery image ${index + 1}`}
              className="h-full w-full object-cover"
              draggable={false}
            />
            <button
              type="button"
              aria-label={`Remove gallery image ${index + 1}`}
              onClick={() => onRemoveImage(image.id)}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
