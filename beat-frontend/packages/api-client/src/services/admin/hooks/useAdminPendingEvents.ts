import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import type { AdminPendingEventsResponse } from '@beat/types'

import { useAdminEvents } from './useAdminEvents'
import type { UseAdminPendingEventsParams } from '../events.types'

/** @deprecated Use useAdminEvents('pending') instead. */
export const useAdminPendingEvents = (
  params: UseAdminPendingEventsParams = {}
): UseQueryResult<AdminPendingEventsResponse, Error> => {
  return useAdminEvents('pending', params)
}
