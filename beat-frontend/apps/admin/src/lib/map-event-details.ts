import type { EventSession, EventWithSessions, SessionMode } from '@beat/types'

import type {
  AdminEventDetail,
  AdminEventLocationType,
  AdminEventSession,
} from './admin-event-view.types'

function mapSessionMode(mode?: SessionMode): AdminEventLocationType {
  switch (mode) {
    case 'ONLINE':
      return 'ONLINE'
    case 'OFFLINE':
    case 'HYBRID':
    default:
      return 'VENUE'
  }
}

function mapSession(session: EventSession): AdminEventSession {
  const galleryUrls =
    session.eventSessionMedias?.gallery?.map((item) => item.url).filter(Boolean) ?? []

  return {
    id: session.id,
    title: session.title ?? 'Session',
    startAt: session.startAt,
    endAt: session.endAt,
    locationType: mapSessionMode(session.mode),
    venueName: session.eventAddress?.venueName,
    ticketTypes: (session.ticketTypes ?? []).map((ticket) => ({
      name: ticket.name,
      price: ticket.price,
      quantity: ticket.quantity,
    })),
    bannerUrl: session.eventSessionMedias?.cover?.url,
    galleryUrls: galleryUrls.length > 0 ? galleryUrls : undefined,
  }
}

function deriveStartAt(sessions: AdminEventSession[], event: EventWithSessions): number | null {
  if (sessions.length > 0) {
    return sessions[0].startAt
  }

  if (typeof event.startAt === 'number') {
    return event.startAt
  }

  return null
}

export function mapEventDetails(
  event: EventWithSessions,
  organiserName?: string
): AdminEventDetail {
  const sessions = (event.sessions ?? []).map(mapSession)

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    status: event.status,
    organiserName: organiserName ?? event.organiserId,
    startAt: deriveStartAt(sessions, event),
    submittedAt: event.updatedAt ?? event.createdAt ?? Date.now(),
    sessions,
  }
}
