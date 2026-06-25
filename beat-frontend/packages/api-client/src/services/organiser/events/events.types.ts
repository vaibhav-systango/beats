import type { Event } from '@beat/types'

export type OrganiserEventsResponse = {
  data: Event[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export type OrganiserEventsView = {
  data: Event[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export type UseOrganiserEventsParams = {
  page?: number
  limit?: number
}
