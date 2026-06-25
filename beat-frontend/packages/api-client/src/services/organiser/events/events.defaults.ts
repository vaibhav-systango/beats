import type { EventStatus } from '@beat/types'

import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'

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
  page: PAGINATION_CONSTANTS.DEFAULT_PAGE,
  limit: PAGINATION_CONSTANTS.ORGANISER_EVENTS_LIMIT,
  hasNextPage: false,
} satisfies OrganiserEventsResponse
