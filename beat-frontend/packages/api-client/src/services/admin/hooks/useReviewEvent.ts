import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query'

import type { ReviewEventInput } from '@beat/types'

import { QUERY_KEYS } from '../../queryKeys'
import { reviewEvent } from '../events.service'
import type { ReviewEventResponse } from '../events.types'

export const useReviewEvent = (): UseMutationResult<
  ReviewEventResponse,
  Error,
  { eventId: string; input: ReviewEventInput }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, input }) => reviewEvent(eventId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ADMIN.EVENTS.all(),
      })
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ADMIN.EVENTS.detail(variables.eventId),
      })
    },
  })
}
