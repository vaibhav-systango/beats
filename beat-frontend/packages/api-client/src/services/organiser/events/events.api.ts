import type {
  CreateEventInput,
  Event,
  EventSession,
  EventWithSessions,
  SubmitEventResponse,
  UpdateEventInput,
} from '@beat/types'

import { API_CONSTANTS } from '../../../constants/api.constants'
import { apiClient } from '../../../axios/axios'
import { rethrowWithApiMessage } from '../../../lib/apiErrorMessage'
import {
  normalizeEventDetails,
  normalizeEventEntity,
} from '../../../lib/normalizeEvent'
import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'

import type { OrganiserEventsResponse, UseOrganiserEventsParams } from './events.types'

function normalizeOrganiserEventsList(
  response: unknown,
  page: number,
  limit: number
): OrganiserEventsResponse {
  const rows = Array.isArray(response)
    ? response
    : Array.isArray((response as OrganiserEventsResponse | undefined)?.data)
      ? (response as OrganiserEventsResponse).data
      : []

  const data = rows.map((item) => normalizeEventEntity(item))

  return {
    data,
    total: data.length,
    page,
    limit,
    hasNextPage: data.length > page * limit,
  }
}

/**
 * GET /api/v1/events/my-events — Authenticated organiser event list.
 */
export async function fetchOrganiserEvents(
  params: UseOrganiserEventsParams = {}
): Promise<OrganiserEventsResponse> {
  const page = params.page ?? PAGINATION_CONSTANTS.DEFAULT_PAGE
  const limit = params.limit ?? PAGINATION_CONSTANTS.ORGANISER_EVENTS_LIMIT

  const { data } = await apiClient.get<unknown>(API_CONSTANTS.EVENTS_MY)

  return normalizeOrganiserEventsList(data, page, limit)
}

/**
 * GET /api/v1/events/:id — Full event details with sessions.
 */
export async function fetchEventById(id: string): Promise<EventWithSessions> {
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
 * POST /api/v1/events — Create a new event shell.
 */
export async function createOrganiserEvent(
  input: CreateEventInput
): Promise<Event> {
  try {
    const { data } = await apiClient.post<unknown>(API_CONSTANTS.EVENTS_CREATE, {
      title: input.title,
      description: input.description ?? '',
      ...(input.slug ? { slug: input.slug } : {}),
    })

    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    return normalizeEventEntity(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * PATCH /api/v1/events/:id — Update event shell metadata.
 */
export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<Event> {
  try {
    const { data } = await apiClient.patch<unknown>(
      API_CONSTANTS.EVENT_BY_ID(id),
      input
    )

    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    if (
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      'eventId' in payload
    ) {
      return fetchEventById(id)
    }

    return normalizeEventEntity(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * POST /api/v1/events/:id/submit — Submit event for admin review.
 */
export async function submitEvent(id: string): Promise<SubmitEventResponse> {
  try {
    const { data } = await apiClient.post<SubmitEventResponse>(
      API_CONSTANTS.EVENT_SUBMIT(id)
    )

    return data ?? { message: 'Event submitted', eventId: id }
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * POST /api/v1/events/:eventId/sessions — Create session (multipart).
 */
export async function createEventSession(
  eventId: string,
  formData: FormData
): Promise<EventSession> {
  try {
    const { data } = await apiClient.post<unknown>(
      API_CONSTANTS.EVENT_SESSIONS(eventId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    return payload as EventSession
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/**
 * PATCH /api/v1/events/:eventId/sessions/:sessionId — Update session (multipart).
 */
export async function updateEventSession(
  eventId: string,
  sessionId: string,
  formData: FormData
): Promise<EventSession> {
  try {
    const { data } = await apiClient.patch<unknown>(
      API_CONSTANTS.EVENT_SESSION(eventId, sessionId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    const payload =
      data && typeof data === 'object' && 'data' in data
        ? (data as { data: unknown }).data
        : data

    return payload as EventSession
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/** @deprecated Use `fetchOrganiserEvents` instead. */
export const getOrganiserEvents = fetchOrganiserEvents
