import type { Event, EventWithSessions } from '@beat/types'

import { createApiResponseNormalizer } from './normalizeApiResponse'

type RawSession = {
  startAt?: number
  eventAddress?: {
    city?: string
    venueName?: string
    formattedAddress?: string
  }
  eventSessionMedias?: {
    cover?: { url?: string }
  }
  ticketTypes?: Array<{ price?: number }>
}

type RawEvent = Record<string, unknown> & {
  organizerId?: string
  organiserId?: string
  sessions?: RawSession[]
  city?: string
  venue?: string
  coverImageUrl?: string
  priceFrom?: number
  startAt?: number
}

function firstSession(raw: RawEvent): RawSession | undefined {
  return Array.isArray(raw.sessions) ? raw.sessions[0] : undefined
}

function deriveStartAt(raw: RawEvent): number | undefined {
  const sessionStart = firstSession(raw)?.startAt
  if (typeof sessionStart === 'number') {
    return sessionStart
  }

  if (typeof raw.startAt === 'number') {
    return raw.startAt
  }

  return undefined
}

function deriveCity(raw: RawEvent): string | undefined {
  if (typeof raw.city === 'string' && raw.city.trim()) {
    return raw.city.trim()
  }

  const city = firstSession(raw)?.eventAddress?.city
  return typeof city === 'string' && city.trim() ? city.trim() : undefined
}

function deriveVenue(raw: RawEvent): string | undefined {
  if (typeof raw.venue === 'string' && raw.venue.trim()) {
    return raw.venue.trim()
  }

  const address = firstSession(raw)?.eventAddress
  const venue = address?.venueName ?? address?.formattedAddress
  return typeof venue === 'string' && venue.trim() ? venue.trim() : undefined
}

function deriveCoverImageUrl(raw: RawEvent): string | undefined {
  if (typeof raw.coverImageUrl === 'string' && raw.coverImageUrl.trim()) {
    return raw.coverImageUrl.trim()
  }

  const cover = firstSession(raw)?.eventSessionMedias?.cover?.url
  return typeof cover === 'string' && cover.trim() ? cover.trim() : undefined
}

function derivePriceFrom(raw: RawEvent): number | undefined {
  if (typeof raw.priceFrom === 'number' && Number.isFinite(raw.priceFrom)) {
    return raw.priceFrom
  }

  const prices = (firstSession(raw)?.ticketTypes ?? [])
    .map((ticket) => ticket.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price))

  if (prices.length === 0) {
    return undefined
  }

  return Math.min(...prices)
}

export function normalizeEventEntity(raw: unknown): Event {
  const source = (raw ?? {}) as RawEvent
  const normalized = createApiResponseNormalizer({
    id: '',
    title: '',
    slug: '',
    description: '',
    status: 'DRAFT',
    organiserId: '',
    createdAt: 0,
    updatedAt: 0,
    startAt: 0,
  })(source)

  return {
    ...normalized,
    description: String(source.description ?? normalized.description ?? ''),
    organiserId: String(
      source.organizerId ?? source.organiserId ?? normalized.organiserId ?? ''
    ),
    startAt: deriveStartAt(source),
    city: deriveCity(source),
    venue: deriveVenue(source),
    coverImageUrl: deriveCoverImageUrl(source),
    priceFrom: derivePriceFrom(source),
  }
}

export function normalizeEventDetails(raw: unknown): EventWithSessions {
  const source = (raw ?? {}) as RawEvent & { sessions?: unknown[] }
  const event = normalizeEventEntity(source)

  return {
    ...event,
    sessions: Array.isArray(source.sessions)
      ? (source.sessions as EventWithSessions['sessions'])
      : [],
  }
}
