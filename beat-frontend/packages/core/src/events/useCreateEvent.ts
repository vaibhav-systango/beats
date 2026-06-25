import {
  createEvent,
  QUERY_KEYS,
  queryClient,
} from '@beat/api-client'
import type { CreateEventInput, Event } from '@beat/types'
import {
  useMutation,
  type UseMutationResult,
} from '@tanstack/react-query'

import {
  getCreateEventErrorMessage,
  validateCreateEventInput,
} from './validateCreateEvent'

async function invalidateEventLists(): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.COMMON.EVENTS.all(),
      exact: false,
    }),
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.ORGANISER.EVENTS.all(),
      exact: false,
    }),
  ])
}

/**
 * Shared create-event business hook.
 * Validates input, calls the API, and refreshes event lists across apps.
 */
export function useCreateEvent(): UseMutationResult<Event, Error, CreateEventInput> {
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const errors = validateCreateEventInput(input)
      if (errors.length > 0) {
        throw new Error(getCreateEventErrorMessage(errors))
      }

      return createEvent({
        ...input,
        title: input.title.trim(),
        status: input.status ?? 'DRAFT',
      })
    },
    onSuccess: () => {
      void invalidateEventLists()
    },
  })
}
