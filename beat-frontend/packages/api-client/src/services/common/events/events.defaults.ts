import type { EventStatus } from '@beat/types'

import type { EventsListResponse } from './events.types'

export const EVENT_ENTITY_DEFAULTS = {
  id: '',
  title: '',
  slug: '',
  description: null,
  startAt: 0,
  status: 'DRAFT' as EventStatus,
  organiserId: '',
}

export const EVENTS_LIST_RESPONSE_DEFAULTS = {
  data: [],
  total: 0,
  page: 1,
  limit: 24,
  hasNextPage: false,
} satisfies EventsListResponse
