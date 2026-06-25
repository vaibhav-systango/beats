import type { EventStatus } from '@beat/types'

import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'

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
  page: PAGINATION_CONSTANTS.DEFAULT_PAGE,
  limit: PAGINATION_CONSTANTS.EVENTS_LIST_LIMIT,
  hasNextPage: false,
} satisfies EventsListResponse
