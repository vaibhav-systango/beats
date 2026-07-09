import type {
  CreateEventInput,
  Event,
  EventSession,
  EventWithSessions,
  SubmitEventResponse,
  UpdateEventInput,
} from '@beat/types'

export type OrganiserEventsResponse = {
  data: Event[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export type OrganiserEventsView = OrganiserEventsResponse

export type UseOrganiserEventsParams = {
  page?: number
  limit?: number
}

export type { CreateEventInput, Event, EventSession, EventWithSessions, UpdateEventInput }

export type SubmitEventResult = SubmitEventResponse
