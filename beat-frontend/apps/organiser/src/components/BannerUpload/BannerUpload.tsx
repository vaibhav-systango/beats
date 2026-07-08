import { Input, Label } from '@beat/ui'
import type { RefObject } from 'react'

/** Presentational banner upload — all state and validation live in the parent. */
export interface BannerUploadProps {
  inputId: string
  inputRef: RefObject<HTMLInputElement>
  label: string
  helperText: string
  displayUrl: string | null
  emptyStateLabel: string
  updateLabel: string
  error?: string | null
  accept?: string
  onOpenPicker: () => void
  onFileChange: (file: File | null) => void
}

export function BannerUpload({
  inputId,
  inputRef,
  label,
  helperText,
  displayUrl,
  emptyStateLabel,
  updateLabel,
  error,
  accept = 'image/jpeg,image/png,image/webp',
  onOpenPicker,
  onFileChange,
}: BannerUploadProps) {
  const hasBanner = Boolean(displayUrl)

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted-foreground">{helperText}</p>

      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />

      {hasBanner ? (
        <div className="group relative overflow-hidden rounded-lg border border-border">
          <img
            src={displayUrl ?? undefined}
            alt="Event banner preview"
            className="max-h-[280px] w-full object-cover"
          />
          <button
            type="button"
            onClick={onOpenPicker}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <span className="rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow">
              {updateLabel}
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          {emptyStateLabel}
        </button>
      )}

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
