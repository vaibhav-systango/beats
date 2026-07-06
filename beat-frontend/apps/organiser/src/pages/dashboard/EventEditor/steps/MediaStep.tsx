import { useUpdateEventSession } from '@beat/api-client'
import { Button, Input, Label, Loader2 } from '@beat/ui'
import type { EventSession } from '@beat/types'
import { useState } from 'react'

import { EVENT_EDITOR_COPY } from '@/constants'
import { buildSessionFormData } from '@/lib/sessionFormData'

export interface MediaStepProps {
  eventId: string
  session?: EventSession
  onBack: () => void
  onNext: () => void
}

export function MediaStep({ eventId, session, onBack, onNext }: MediaStepProps) {
  const updateSession = useUpdateEventSession()

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (advance = false) => {
    setError(null)

    if (!session?.id) {
      setError('Complete Basic Info before uploading media.')
      return
    }

    if (!coverFile && !session.eventSessionMedias?.cover && galleryFiles.length === 0) {
      if (advance) {
        onNext()
        return
      }
    }

    try {
      const formData = buildSessionFormData(
        {
          categoryIds: session.categoryIds ?? [],
          startAt: session.startAt,
          endAt: session.endAt,
          location: session.location,
          eventAddress: session.eventAddress,
          capacity: session.capacity,
          mode: session.mode,
          ticketSaleStartAt: session.ticketSaleStartAt,
          ticketSaleEndAt: session.ticketSaleEndAt,
          ticketTypes: session.ticketTypes ?? [],
        },
        {
          cover: coverFile ?? undefined,
          gallery: galleryFiles.length ? galleryFiles : undefined,
        }
      )

      await updateSession.mutateAsync({
        eventId,
        sessionId: session.id,
        formData,
      })

      if (advance) {
        onNext()
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save media.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{EVENT_EDITOR_COPY.MEDIA_TITLE}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {EVENT_EDITOR_COPY.MEDIA_DESCRIPTION}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Upload event banner</Label>
          <p className="text-xs text-muted-foreground">
            Max image size 10MB. Recommended dimension: 1200×600px (2:1)
          </p>
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6">
            {session?.eventSessionMedias?.cover ? (
              <p className="mb-2 text-sm text-muted-foreground">Banner uploaded</p>
            ) : null}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-url">Add a promotional video</Label>
          <p className="text-xs text-muted-foreground">
            Share a YouTube link to showcase your event in action.
          </p>
          <Input
            id="video-url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="ex. https://youtube.com/yourvideo"
          />
          <p className="text-xs text-amber-600">
            URL-only video links require a backend update; file upload is supported today.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Upload media</Label>
          <p className="text-xs text-muted-foreground">
            Gallery images appear under the gallery section.
          </p>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setGalleryFiles(e.target.files ? Array.from(e.target.files) : [])
              }
            />
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {EVENT_EDITOR_COPY.BACK}
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={updateSession.isPending}
            onClick={() => void handleSave(false)}
          >
            {updateSession.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              EVENT_EDITOR_COPY.SAVE
            )}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={updateSession.isPending}
            onClick={() => void handleSave(true)}
          >
            {updateSession.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              EVENT_EDITOR_COPY.NEXT
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
