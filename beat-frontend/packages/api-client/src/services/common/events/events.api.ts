import type { Event } from '@beat/types'

import { API_CONSTANTS } from '../../../constants/api.constants'
import { apiClient } from '../../../axios/axios'
import { rethrowWithApiMessage } from '../../../lib/apiErrorMessage'
import {
  createApiResponseNormalizer,
  createPaginatedGetResponseNormalizer,
} from '../../../lib/normalizeApiResponse'

import {
  EVENT_ENTITY_DEFAULTS,
  EVENTS_LIST_RESPONSE_DEFAULTS,
} from './events.defaults'
import type {
  CreateEventInput,
  CreateEventResponse,
  EventsListResponse,
  GetEventsParams,
} from './events.types'

const normalizeEventsList = createPaginatedGetResponseNormalizer(
  EVENTS_LIST_RESPONSE_DEFAULTS,
  EVENT_ENTITY_DEFAULTS
) as (response: unknown) => EventsListResponse

const normalizeCreatedEvent = createApiResponseNormalizer(EVENT_ENTITY_DEFAULTS)

/**
 * GET /events — Public paginated event list.
 */
export async function fetchEvents(
  params: GetEventsParams = {}
): Promise<EventsListResponse> {
  const { data } = await apiClient.get<EventsListResponse>(
    API_CONSTANTS.EVENTS_LIST,
    { params }
  )

  return normalizeEventsList(data)
}

/**
 * POST /events — Create a new event.
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  try {
    const { data } = await apiClient.post<CreateEventResponse | Event>(
      API_CONSTANTS.EVENTS_CREATE,
      input
    )

    const payload =
      data && typeof data === 'object' && 'data' in data ? data.data : data

    return normalizeCreatedEvent(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/** @deprecated Use `fetchEvents` instead. */
export const getEvents = fetchEvents
