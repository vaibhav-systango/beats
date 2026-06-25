import type { Event } from '@beat/types'
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'
import { QUERY_KEYS } from '../../queryKeys'

import { createEvent, fetchEvents } from './events.api'
import type { CreateEventInput, EventsListView, UseEventsListParams } from './events.types'

export const useEventsList = (
  params: UseEventsListParams = {}
): UseQueryResult<EventsListView, Error> => {
  const {
    page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit = PAGINATION_CONSTANTS.EVENTS_LIST_LIMIT,
    status,
  } = params

  return useQuery({
    queryKey: QUERY_KEYS.COMMON.EVENTS.list({ page, limit, status }),
    queryFn: () => fetchEvents({ page, limit, status }),
    placeholderData: (previousData) => previousData,
    select: (response): EventsListView => ({
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasNextPage: response.hasNextPage,
    }),
  })
}

export const useCreateEventMutation = (): UseMutationResult<
  Event,
  Error,
  CreateEventInput
> => {
  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
  })
}
