import type { EventSession, VideoMediaFile } from '@beat/types'

import { parseYouTubeVideoId } from '@/lib/validation'

export function buildYouTubeVideoMetadata(url: string): VideoMediaFile | null {
  const videoId = parseYouTubeVideoId(url)
  if (!videoId) {
    return null
  }

  return {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    mime_type: 'video/youtube',
    size: 0,
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    original_name: `youtube-${videoId}`,
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = parseYouTubeVideoId(url)
  if (!videoId) {
    return null
  }

  return `https://www.youtube.com/embed/${videoId}`
}

export function getYouTubeUrlFromSession(session?: EventSession): string {
  const youtubeVideo = session?.eventSessionMedias?.videos?.find(
    (video) => video.mime_type === 'video/youtube'
  )

  return youtubeVideo?.url ?? ''
}
