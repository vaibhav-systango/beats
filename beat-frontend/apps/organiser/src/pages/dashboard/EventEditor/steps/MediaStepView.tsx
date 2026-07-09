import { Button, Loader2 } from '@beat/ui'
import type { ReactNode } from 'react'

import type { BannerUploadProps } from '@/components/BannerUpload/BannerUpload'
import { BannerUpload } from '@/components/BannerUpload/BannerUpload'
import type { GalleryUploadProps } from '@/components/GalleryUpload/GalleryUpload'
import { GalleryUpload } from '@/components/GalleryUpload/GalleryUpload'
import type { YouTubePreviewProps } from '@/components/YouTubePreview/YouTubePreview'
import { YouTubePreview } from '@/components/YouTubePreview/YouTubePreview'

/** Presentational Media step layout — container owns state, handlers, and API calls. */
export interface MediaStepViewProps {
  title: string
  description: string
  banner: BannerUploadProps
  youtube: YouTubePreviewProps
  gallery: GalleryUploadProps
  error?: string | null
  isSaving: boolean
  backLabel: string
  nextLabel: string
  onBack: () => void
  onSaveAndNext: () => void
  footerStart?: ReactNode
}

export function MediaStepView({
  title,
  description,
  banner,
  youtube,
  gallery,
  error,
  isSaving,
  backLabel,
  nextLabel,
  onBack,
  onSaveAndNext,
}: MediaStepViewProps) {
  return (
    <div className="w-full min-w-0 space-y-8 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-6">
        <BannerUpload {...banner} />
        <YouTubePreview {...youtube} />
        <GalleryUpload {...gallery} />
      </div>

      {error ? (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
        <Button type="button" variant="primary" disabled={isSaving} onClick={onSaveAndNext}>
          {isSaving ? <Loader2 className="animate-spin" /> : nextLabel}
        </Button>
      </div>
    </div>
  )
}
