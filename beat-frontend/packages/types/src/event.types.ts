export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED'

export interface Event {
  id: string // ULID
  title: string
  slug: string
  description: string | null
  startAt: number // epoch ms
  status: EventStatus
  organiserId: string
}

export interface GetEventsParams {
  page?: number
  limit?: number
  status?: EventStatus
}

export interface CreateEventInput {
  title: string
  description?: string | null
  startAt: number
  status?: EventStatus
}
