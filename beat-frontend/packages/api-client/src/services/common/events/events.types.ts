import type { CreateEventInput, Event, GetEventsParams } from '@beat/types'

export type EventsListResponse = {
  data: Event[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export type CreateEventResponse = {
  data: Event
  message?: string
}

export type { CreateEventInput, GetEventsParams }

export type EventsListView = {
  data: Event[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export type UseEventsListParams = GetEventsParams
