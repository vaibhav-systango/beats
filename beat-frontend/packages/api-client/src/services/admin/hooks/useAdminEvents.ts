import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import type { AdminEventsTab, AdminPendingEventsResponse } from '@beat/types'

import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'
import { QUERY_KEYS } from '../../queryKeys'
import { fetchAdminEvents } from '../events.service'
import type { UseAdminPendingEventsParams } from '../events.types'

export const useAdminEvents = (
  tab: AdminEventsTab,
  params: UseAdminPendingEventsParams = {}
): UseQueryResult<AdminPendingEventsResponse, Error> => {
  const {
    page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit = PAGINATION_CONSTANTS.ADMIN_PENDING_EVENTS_LIMIT,
  } = params

  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.EVENTS.list(tab, page, limit),
    queryFn: () => fetchAdminEvents(tab, { page, limit }),
  })
}
