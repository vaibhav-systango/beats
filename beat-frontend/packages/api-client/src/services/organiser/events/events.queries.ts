import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { QUERY_KEYS } from '../../queryKeys'

import { fetchOrganiserEvents } from './events.api'
import type {
  OrganiserEventsResponse,
  OrganiserEventsView,
  UseOrganiserEventsParams,
} from './events.types'

const keepPreviousOrganiserEvents = (
  previousData: OrganiserEventsResponse | undefined
) => previousData

export const useOrganiserEvents = (
  params: UseOrganiserEventsParams = {}
): UseQueryResult<OrganiserEventsView, Error> => {
  const { page = 1, limit = 20 } = params

  return useQuery({
    queryKey: QUERY_KEYS.ORGANISER.EVENTS.list(page, limit),
    queryFn: () => fetchOrganiserEvents({ page, limit }),
    placeholderData: keepPreviousOrganiserEvents,
    select: (response): OrganiserEventsView => ({
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasNextPage: response.hasNextPage,
    }),
  })
}

/** @deprecated Use `useOrganiserEvents` instead. */
export const useEvents = useOrganiserEvents
