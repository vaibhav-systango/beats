import { Input, Label } from '@beat/ui'

/** Presentational YouTube URL field — validation and embed URL live in the parent. */
export interface YouTubePreviewProps {
  inputId?: string
  label: string
  helperText: string
  placeholder: string
  value: string
  error?: string | null
  embedUrl: string | null
  onChange: (value: string) => void
  onBlur: () => void
}

export function YouTubePreview({
  inputId = 'video-url',
  label,
  helperText,
  placeholder,
  value,
  error,
  embedUrl,
  onChange,
  onBlur,
}: YouTubePreviewProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted-foreground">{helperText}</p>
      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      {embedUrl && !error ? (
        <div className="w-full max-w-[280px] overflow-hidden rounded-lg border border-border">
          <iframe
            src={embedUrl}
            title="YouTube promotional video preview"
            className="aspect-square w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
    </div>
  )
}
