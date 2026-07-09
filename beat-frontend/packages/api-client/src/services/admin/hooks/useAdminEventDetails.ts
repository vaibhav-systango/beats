import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import type { EventWithSessions } from '@beat/types'

import { QUERY_KEYS } from '../../queryKeys'
import { fetchAdminEventDetails } from '../events.service'

export const useAdminEventDetails = (
  eventId: string | undefined
): UseQueryResult<EventWithSessions, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.EVENTS.detail(eventId ?? ''),
    queryFn: () => fetchAdminEventDetails(eventId!),
    enabled: Boolean(eventId),
  })
}
