import type { EventCategory } from '@beat/types'

export type GetEventCategoriesParams = {
  limit?: number
  offset?: number
}

export type EventCategoriesListResponse = {
  data: EventCategory[]
  total: number
  limit: number
  offset: number
}
