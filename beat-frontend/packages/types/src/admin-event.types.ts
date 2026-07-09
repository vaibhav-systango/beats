import type { EventStatus } from './event.types'

/** Single row in GET /api/v1/events/admin/pending. */
export interface AdminPendingEvent {
  id: string
  title: string
  status: EventStatus
  organiserName: string
  startAt: number | null
  submittedAt: number
}

export interface AdminPendingEventsPagination {
  total: number
  page: number
  limit: number
}

/** Response envelope for GET /api/v1/events/admin/pending. */
export interface AdminPendingEventsResponse {
  data: AdminPendingEvent[]
  pagination: AdminPendingEventsPagination
}

/** Matches backend ReviewAction enum on POST /api/v1/events/admin/:id/review. */
export type ReviewEventAction = 'APPROVE' | 'REJECT'

/** Client payload for POST /api/v1/events/admin/:id/review (adminId set server-side). */
export interface ReviewEventInput {
  action: ReviewEventAction
  reason?: string
}
