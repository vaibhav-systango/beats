import type { Event, EventWithSessions } from '@beat/types'

import { createApiResponseNormalizer } from './normalizeApiResponse'

type RawEvent = Record<string, unknown> & {
  organizerId?: string
  organiserId?: string
  sessions?: Array<{ startAt?: number }>
}

function deriveStartAt(raw: RawEvent): number | undefined {
  const sessionStart = raw.sessions?.[0]?.startAt
  if (typeof sessionStart === 'number') {
    return sessionStart
  }

  if (typeof raw.startAt === 'number') {
    return raw.startAt
  }

  return undefined
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
