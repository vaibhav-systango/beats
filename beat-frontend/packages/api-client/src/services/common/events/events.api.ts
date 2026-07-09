import type { Event } from '@beat/types'

import { API_CONSTANTS } from '../../../constants/api.constants'
import { apiClient } from '../../../axios/axios'
import { rethrowWithApiMessage } from '../../../lib/apiErrorMessage'
import { normalizeEventEntity } from '../../../lib/normalizeEvent'
import {
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

/**
 * GET /api/v1/events — Public paginated event list.
 */
export async function fetchEvents(
  params: GetEventsParams = {}
): Promise<EventsListResponse> {
  const { data } = await apiClient.get<EventsListResponse>(
    API_CONSTANTS.EVENTS_LIST,
    { params }
  )

  const normalized = normalizeEventsList(data)
  return {
    ...normalized,
    data: normalized.data.map((item) => normalizeEventEntity(item)),
  }
}

/**
 * POST /api/v1/events — Create a new event.
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  try {
    const { data } = await apiClient.post<CreateEventResponse | Event>(
      API_CONSTANTS.EVENTS_CREATE,
      {
        title: input.title,
        description: input.description ?? '',
        ...(input.slug ? { slug: input.slug } : {}),
      }
    )

    const payload =
      data && typeof data === 'object' && 'data' in data ? data.data : data

    return normalizeEventEntity(payload)
  } catch (error) {
    rethrowWithApiMessage(error)
  }
}

/** @deprecated Use `fetchEvents` instead. */
export const getEvents = fetchEvents
