import type { EventStatus } from './event.types'

/** Single row in GET /api/v1/events/admin/events (any status filter). */
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

/** Response envelope for admin events list endpoints. */
export interface AdminPendingEventsResponse {
  data: AdminPendingEvent[]
  pagination: AdminPendingEventsPagination
}

/** UI tabs on the admin events list page. */
export type AdminEventsTab = 'pending' | 'accepted' | 'rejected'

/**
 * Backend `status` query values for GET /api/v1/events/admin/events.
 * `ACCEPTED` returns events with status PUBLISHED or APPROVED.
 */
export type AdminEventsListFilter =
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'APPROVED'
  | 'ACCEPTED'

export interface AdminEventsListParams {
  page?: number
  limit?: number
}

export function adminEventsTabToStatusFilter(tab: AdminEventsTab): AdminEventsListFilter {
  switch (tab) {
    case 'pending':
      return 'PENDING_APPROVAL'
    case 'accepted':
      return 'ACCEPTED'
    case 'rejected':
      return 'REJECTED'
  }
}

/** @deprecated Use AdminEventsListParams */
export type UseAdminPendingEventsParams = AdminEventsListParams

/** Matches backend ReviewAction enum on POST /api/v1/events/admin/:id/review. */
export type ReviewEventAction = 'APPROVE' | 'REJECT'

/** Client payload for POST /api/v1/events/admin/:id/review (adminId set server-side). */
export interface ReviewEventInput {
  action: ReviewEventAction
  reason?: string
}
