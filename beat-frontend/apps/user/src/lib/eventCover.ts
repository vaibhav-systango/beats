/** Curated Unsplash covers for demo events missing a real media URL. */
const COVER_BY_THEME = {
  music:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
  tech: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  festival:
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
  sports:
    'https://images.unsplash.com/photo-1461896830418-74bbb9cc8fdf?auto=format&fit=crop&w=1200&q=80',
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
  arts: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
  nightlife:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  city: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80',
} as const

const COVER_POOL = Object.values(COVER_BY_THEME)

function hashSeed(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function isUsableCoverUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  try {
    const host = new URL(trimmed).hostname.toLowerCase()
    if (host === 'cdn.example.com' || host.endsWith('.example.com')) {
      return false
    }
  } catch {
    return false
  }
  return true
}

function pickThemedCover(title?: string, city?: string, seed = ''): string {
  const haystack = `${title ?? ''} ${city ?? ''}`.toLowerCase()

  if (/music|folk|gig|concert|dj|band|jazz/.test(haystack)) {
    return COVER_BY_THEME.music
  }
  if (/festival|carnival|holi|celebration/.test(haystack)) {
    return COVER_BY_THEME.festival
  }
  if (
    /startup|summit|tech|ai|cloud|cyber|innovation|dev|hack|saas|fintech|payments/.test(
      haystack
    )
  ) {
    return COVER_BY_THEME.tech
  }
  if (/sport|fitness|run|marathon|cricket|football|yoga/.test(haystack)) {
    return COVER_BY_THEME.sports
  }
  if (/food|culinary|wine|dining|chef|taste/.test(haystack)) {
    return COVER_BY_THEME.food
  }
  if (/comedy|theatre|theater|art|fashion|film|cinema/.test(haystack)) {
    return COVER_BY_THEME.arts
  }
  if (/night|club|party|rave/.test(haystack)) {
    return COVER_BY_THEME.nightlife
  }

  return COVER_POOL[hashSeed(seed || title || city || 'beats') % COVER_POOL.length]
}

/**
 * Prefer a real event cover; otherwise pick a stable thematic fallback so cards
 * never render empty “Beats” placeholders for demo seed data.
 */
export function resolveEventCoverUrl(input: {
  coverImageUrl?: string | null
  title?: string
  city?: string
  id?: string
}): string {
  if (isUsableCoverUrl(input.coverImageUrl)) {
    return input.coverImageUrl.trim()
  }
  return pickThemedCover(input.title, input.city, input.id ?? '')
}
