import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { QUERY_KEYS } from '../../queryKeys'

import { getEventCategories } from './event-categories.api'
import type { EventCategoriesListResponse, GetEventCategoriesParams } from './event-categories.types'

export const useEventCategories = (
  params: GetEventCategoriesParams = { limit: 100, offset: 0 }
): UseQueryResult<EventCategoriesListResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.COMMON.EVENT_CATEGORIES.list(params),
    queryFn: () => getEventCategories(params),
  })
}
