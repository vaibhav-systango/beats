import {
  BANNER_MAX_BYTES,
  EVENT_DESCRIPTION_MIN_LENGTH,
  EVENT_NAME_MIN_LENGTH,
  GALLERY_MAX_COUNT,
} from '@/constants/event-editor.constants'

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const YOUTUBE_VIDEO_ID_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/

export function validateEventName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Event name is required.'
  }
  if (trimmed.length < EVENT_NAME_MIN_LENGTH) {
    return `Event name must be at least ${EVENT_NAME_MIN_LENGTH} characters.`
  }
  return null
}

export function validateEventDescription(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Event description is required.'
  }
  if (trimmed.length < EVENT_DESCRIPTION_MIN_LENGTH) {
    return `Event description must be at least ${EVENT_DESCRIPTION_MIN_LENGTH} characters.`
  }
  return null
}

export function validateCapacity(value: string | number): string | null {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric < 1) {
    return 'Capacity must be at least 1.'
  }
  return null
}

export function parseYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  const match = trimmed.match(YOUTUBE_VIDEO_ID_PATTERN)
  return match?.[1] ?? null
}

export function validateYouTubeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  if (!parseYouTubeVideoId(trimmed)) {
    return 'Enter a valid YouTube URL.'
  }

  return null
}

export function validateDatetimeRange(start: string, end: string): string | null {
  if (!start || !end) {
    return null
  }

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 'Enter valid start and end date/time values.'
  }

  if (endMs <= startMs) {
    return 'End date and time must be after the start date and time.'
  }

  return null
}

export function validateTicketSaleWindow(
  saleStart: string,
  saleEnd: string,
  sessionStartAt: string
): string | null {
  if (!saleStart || !saleEnd) {
    return null
  }

  const saleStartMs = new Date(saleStart).getTime()
  const saleEndMs = new Date(saleEnd).getTime()

  if (!Number.isFinite(saleStartMs) || !Number.isFinite(saleEndMs)) {
    return 'Enter valid ticket sale start and end values.'
  }

  if (saleEndMs <= saleStartMs) {
    return 'Ticket sale end must be after ticket sale start.'
  }

  if (sessionStartAt) {
    const sessionStartMs = new Date(sessionStartAt).getTime()
    if (Number.isFinite(sessionStartMs) && saleEndMs > sessionStartMs) {
      return 'Ticket sale end cannot be after the event start date and time.'
    }
  }

  return null
}

export function validateImageFile(
  file: File,
  maxBytes: number = BANNER_MAX_BYTES
): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return 'Only JPEG, PNG, and WebP images are supported.'
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024))
    return `Image must be ${maxMb} MB or smaller.`
  }

  return null
}

export function validateGalleryCount(currentCount: number): string | null {
  if (currentCount > GALLERY_MAX_COUNT) {
    return `You can upload up to ${GALLERY_MAX_COUNT} gallery images.`
  }
  return null
}
