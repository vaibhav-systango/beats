export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED'

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  status: EventStatus
  /** Mapped from backend `organizerId`. */
  organiserId: string
  createdAt?: number
  updatedAt?: number
  /** Derived from the first session when available. */
  startAt?: number
}

export interface GetEventsParams {
  page?: number
  limit?: number
  status?: EventStatus
}

export interface CreateEventInput {
  title: string
  description?: string
  slug?: string
}

export interface UpdateEventInput {
  title?: string
  description?: string
  slug?: string
}

export type LocationType = 'VENUE' | 'ONLINE' | 'RECORDED'
