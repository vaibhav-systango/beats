import type { EventStatus } from '@beat/types'

import type { OrganiserEventsResponse } from './events.types'

export const ORGANISER_EVENT_ENTITY_DEFAULTS = {
  id: '',
  title: '',
  slug: '',
  description: null,
  startAt: 0,
  status: 'DRAFT' as EventStatus,
  organiserId: '',
}

export const ORGANISER_EVENTS_RESPONSE_DEFAULTS = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  hasNextPage: false,
} satisfies OrganiserEventsResponse
