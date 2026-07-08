import { useUpdateEventSession } from '@beat/api-client'
import type { EventSession, EventSessionMedias, GalleryMediaFile } from '@beat/types'
import { useId, useMemo, useRef, useState } from 'react'

import { MediaStepView } from './MediaStepView'

import { EVENT_EDITOR_COPY } from '@/constants'
import { GALLERY_MAX_COUNT } from '@/constants/event-editor.constants'
import { useObjectUrl, useObjectUrls } from '@/lib/hooks/useObjectUrl'
import { buildSessionPatchFormData, hasSessionPatchPayload } from '@/lib/sessionFormData'
import { buildYouTubeVideoMetadata, getYouTubeEmbedUrl, getYouTubeUrlFromSession } from '@/lib/youtubeMedia'


export interface MediaStepProps {
  eventId: string
  session?: EventSession
  onBack: () => void
  onNext: () => void
}

function buildMediaSessionPatch(
  session: EventSession | undefined,
  existingGallery: GalleryMediaFile[],
  videoUrl: string
): { eventSessionMedias: EventSessionMedias } {
  const fileVideos =
    session?.eventSessionMedias?.videos?.filter((video) => video.mime_type !== 'video/youtube') ??
    []
  const youtubeVideo = videoUrl.trim() ? buildYouTubeVideoMetadata(videoUrl) : null
  const videos = youtubeVideo ? [...fileVideos, youtubeVideo] : fileVideos

  return {
    eventSessionMedias: {
      ...session?.eventSessionMedias,
      gallery: existingGallery.map((item, index) => ({
        ...item,
        sort_order: index,
      })),
      videos,
    },
  }
}

function hasGalleryChanged(
  session: EventSession | undefined,
  existingGallery: GalleryMediaFile[]
): boolean {
  const original = session?.eventSessionMedias?.gallery ?? []
  if (original.length !== existingGallery.length) {
    return true
  }

  return original.some((item, index) => item.url !== existingGallery[index]?.url)
}

function hasVideoChanged(session: EventSession | undefined, videoUrl: string): boolean {
  return getYouTubeUrlFromSession(session) !== videoUrl.trim()
}

export function MediaStep({ eventId, session, onBack, onNext }: MediaStepProps) {
  const updateSession = useUpdateEventSession()

  const bannerInputId = useId()
  const galleryInputId = useId()
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [existingGallery, setExistingGallery] = useState<GalleryMediaFile[]>(
    () => session?.eventSessionMedias?.gallery ?? []
  )
  const [videoUrl, setVideoUrl] = useState(() => getYouTubeUrlFromSession(session))
  const [error, setError] = useState<string | null>(null)

  const coverPreviewUrl = useObjectUrl(coverFile)
  const pendingPreviewUrls = useObjectUrls(galleryFiles)
  const bannerDisplayUrl = coverPreviewUrl ?? session?.eventSessionMedias?.cover?.url ?? null
  const youtubeEmbedUrl = videoUrl.trim() ? getYouTubeEmbedUrl(videoUrl) : null

  const galleryImages = useMemo(() => {
    const existing = existingGallery.map((media, index) => ({
      id: `existing-${media.url}-${index}`,
      url: media.url,
      kind: 'existing' as const,
      media,
    }))

    const pending = galleryFiles.map((file, index) => ({
      id: `pending-${file.name}-${index}`,
      url: pendingPreviewUrls[index] ?? '',
      kind: 'pending' as const,
      file,
    }))

    return [...existing, ...pending]
  }, [existingGallery, galleryFiles, pendingPreviewUrls])

  const buildSavePayload = () => {
    const files = {
      cover: coverFile ?? undefined,
      gallery: galleryFiles.length ? galleryFiles : undefined,
    }

    const shouldPatchMedias =
      hasGalleryChanged(session, existingGallery) || hasVideoChanged(session, videoUrl)

    const sessionPatch = shouldPatchMedias
      ? buildMediaSessionPatch(session, existingGallery, videoUrl)
      : {}

    return { files, sessionPatch }
  }

  const handleBannerFileChange = (file: File | null) => {
    if (!file) {
      return
    }
    setCoverFile(file)
  }

  const handleGalleryFilesSelected = (files: FileList | null) => {
    if (!files?.length) {
      return
    }
    setGalleryFiles((current) => [...current, ...Array.from(files)])
  }

  const handleRemoveGalleryImage = (id: string) => {
    const item = galleryImages.find((image) => image.id === id)
    if (!item) {
      return
    }

    if (item.kind === 'existing') {
      setExistingGallery((current) =>
        current.filter((image) => image.url !== item.media.url)
      )
    } else {
      setGalleryFiles((current) => current.filter((file) => file !== item.file))
    }
  }

  const handleSaveAndNext = async () => {
    setError(null)

    if (!session?.id) {
      setError('No session found for this event.')
      return
    }

    const { files, sessionPatch } = buildSavePayload()

    try {
      if (hasSessionPatchPayload(sessionPatch, files)) {
        const formData = buildSessionPatchFormData(sessionPatch, files)
        await updateSession.mutateAsync({
          eventId,
          sessionId: session.id,
          formData,
        })

        setGalleryFiles([])
        setCoverFile(null)
      }

      onNext()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save media.')
    }
  }

  return (
    <MediaStepView
      title={EVENT_EDITOR_COPY.MEDIA_TITLE}
      description={EVENT_EDITOR_COPY.MEDIA_DESCRIPTION}
      error={error}
      isSaving={updateSession.isPending}
      backLabel={EVENT_EDITOR_COPY.BACK}
      nextLabel={EVENT_EDITOR_COPY.NEXT}
      onBack={onBack}
      onSaveAndNext={() => void handleSaveAndNext()}
      banner={{
        inputId: bannerInputId,
        inputRef: bannerInputRef,
        label: 'Upload event banner',
        helperText: 'Max image size 10MB. Recommended dimension: 1200×600px (2:1)',
        displayUrl: bannerDisplayUrl,
        emptyStateLabel: 'Choose banner image',
        updateLabel: 'Update banner',
        onOpenPicker: () => bannerInputRef.current?.click(),
        onFileChange: handleBannerFileChange,
      }}
      youtube={{
        label: 'Add a promotional video',
        helperText: 'Share a YouTube link to showcase your event in action.',
        placeholder: 'ex. https://youtube.com/watch?v=...',
        value: videoUrl,
        embedUrl: youtubeEmbedUrl,
        onChange: setVideoUrl,
        onBlur: () => {},
      }}
      gallery={{
        inputId: galleryInputId,
        inputRef: galleryInputRef,
        title: EVENT_EDITOR_COPY.GALLERY_TITLE,
        description: EVENT_EDITOR_COPY.GALLERY_DESCRIPTION,
        uploadLabel: EVENT_EDITOR_COPY.GALLERY_UPLOAD_IMAGE,
        images: galleryImages.map(({ id, url }) => ({ id, url })),
        canAddMore: galleryImages.length < GALLERY_MAX_COUNT,
        onOpenPicker: () => galleryInputRef.current?.click(),
        onFilesSelected: handleGalleryFilesSelected,
        onRemoveImage: handleRemoveGalleryImage,
      }}
    />
  )
}
