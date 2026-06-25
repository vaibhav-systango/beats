import { API_CONSTANTS } from '../../../constants/api.constants'
import { apiClient } from '../../../axios/axios'
import { createPaginatedGetResponseNormalizer } from '../../../lib/normalizeApiResponse'

import {
  ORGANISER_EVENT_ENTITY_DEFAULTS,
  ORGANISER_EVENTS_RESPONSE_DEFAULTS,
} from './events.defaults'
import type { OrganiserEventsResponse, UseOrganiserEventsParams } from './events.types'

const normalizeOrganiserEventsList = createPaginatedGetResponseNormalizer(
  ORGANISER_EVENTS_RESPONSE_DEFAULTS,
  ORGANISER_EVENT_ENTITY_DEFAULTS
) as (response: unknown) => OrganiserEventsResponse

/**
 * GET /organiser/events — Authenticated organiser event list.
 */
export async function fetchOrganiserEvents(
  params: UseOrganiserEventsParams = {}
): Promise<OrganiserEventsResponse> {
  const { data } = await apiClient.get<OrganiserEventsResponse>(
    API_CONSTANTS.ORGANISER_EVENTS,
    { params }
  )

  return normalizeOrganiserEventsList(data)
}

/** @deprecated Use `fetchOrganiserEvents` instead. */
export const getOrganiserEvents = fetchOrganiserEvents
