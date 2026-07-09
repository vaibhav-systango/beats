import type {
  AdminEventsTab,
  AdminPendingEventsResponse,
  AdminEventsListParams,
  EventWithSessions,
  ReviewEventInput,
} from '@beat/types'
import { adminEventsTabToStatusFilter } from '@beat/types'

import { API_CONSTANTS } from '../../constants/api.constants'
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants'
import { apiClient } from '../../axios/axios'
import { rethrowWithApiMessage } from '../../lib/apiErrorMessage'
import { normalizeEventDetails } from '../../lib/normalizeEvent'

import type { ReviewEventResponse } from './events.types'

/**
 * GET /api/v1/events/admin/events — Paginated admin events by status tab (ADMIN).
 */
export async function fetchAdminEvents(
  tab: AdminEventsTab,
  params: AdminEventsListParams = {}
): Promise<AdminPendingEventsResponse> {
  const page = params.page ?? PAGINATION_CONSTANTS.DEFAULT_PAGE
  const limit = params.limit ?? PAGINATION_CONSTANTS.ADMIN_PENDING_EVENTS_LIMIT
  const status = adminEventsTabToStatusFilter(tab)

  try {
    const { data } = await apiClient.get<AdminPendingEventsResponse>(
      API_CONSTANTS.ADMIN_EVENTS_LIST,
      { params: { status, page, limit } }
    )

    return data
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * GET /api/v1/events/admin/pending — Paginated pending approval events (ADMIN).
 * @deprecated Use fetchAdminEvents('pending') instead.
 */
export async function fetchAdminPendingEvents(
  params: AdminEventsListParams = {}
): Promise<AdminPendingEventsResponse> {
  return fetchAdminEvents('pending', params)
}

/**
 * GET /api/v1/events/:id — Full event details for admin review.
 */
export async function fetchAdminEventDetails(id: string): Promise<EventWithSessions> {
  try {
    const { data } = await apiClient.get<unknown>(API_CONSTANTS.EVENT_BY_ID(id))
    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    return normalizeEventDetails(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * POST /api/v1/events/admin/:id/review — Approve or reject a pending event (ADMIN).
 */
export async function reviewEvent(
  eventId: string,
  input: ReviewEventInput
): Promise<ReviewEventResponse> {
  try {
    const body: ReviewEventInput = { action: input.action }

    if (input.action === 'REJECT' && input.reason?.trim()) {
      body.reason = input.reason.trim()
    }

    const { data } = await apiClient.post<unknown>(
      API_CONSTANTS.ADMIN_EVENT_REVIEW(eventId),
      body
    )

    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof (payload as { message: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : 'Event reviewed successfully.'

    return { message }
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}
