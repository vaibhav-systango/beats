import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { PAGINATION_CONSTANTS } from '../../../constants/pagination.constants'
import { QUERY_KEYS } from '../../queryKeys'

import {
  createEventSession,
  createOrganiserEvent,
  deleteEventSession,
  fetchEventById,
  fetchOrganiserEvents,
  submitEvent,
  updateEvent,
  updateEventSession,
} from './events.api'
import type {
  OrganiserEventsResponse,
  OrganiserEventsView,
  UseOrganiserEventsParams,
} from './events.types'
import type {
  CreateEventInput,
  Event,
  EventSession,
  EventWithSessions,
  SubmitEventResponse,
  UpdateEventInput,
} from '@beat/types'

const keepPreviousOrganiserEvents = (
  previousData: OrganiserEventsResponse | undefined
) => previousData

export const useOrganiserEvents = (
  params: UseOrganiserEventsParams = {}
): UseQueryResult<OrganiserEventsView, Error> => {
  const {
    page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit = PAGINATION_CONSTANTS.ORGANISER_EVENTS_LIMIT,
  } = params

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

export const useEventDetails = (
  eventId: string | undefined
): UseQueryResult<EventWithSessions, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.ORGANISER.EVENTS.detail(eventId ?? ''),
    queryFn: () => fetchEventById(eventId!),
    enabled: Boolean(eventId),
  })
}

export const useCreateOrganiserEvent = (): UseMutationResult<
  Event,
  Error,
  CreateEventInput
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrganiserEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.all(),
      })
    },
  })
}

export const useUpdateEvent = (): UseMutationResult<
  Event,
  Error,
  { id: string; input: UpdateEventInput }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }) => updateEvent(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.detail(variables.id),
      })
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.all(),
      })
    },
  })
}

export const useSubmitEvent = (): UseMutationResult<
  SubmitEventResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitEvent,
    onSuccess: (_data, eventId) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.detail(eventId),
      })
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.all(),
      })
    },
  })
}

export const useCreateEventSession = (): UseMutationResult<
  EventSession,
  Error,
  { eventId: string; formData: FormData }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, formData }) =>
      createEventSession(eventId, formData),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.detail(variables.eventId),
      })
    },
  })
}

export const useUpdateEventSession = (): UseMutationResult<
  EventSession,
  Error,
  { eventId: string; sessionId: string; formData: FormData }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, sessionId, formData }) =>
      updateEventSession(eventId, sessionId, formData),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.detail(variables.eventId),
      })
    },
  })
}

export const useDeleteEventSession = (): UseMutationResult<
  void,
  Error,
  { eventId: string; sessionId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, sessionId }) => deleteEventSession(eventId, sessionId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORGANISER.EVENTS.detail(variables.eventId),
      })
    },
  })
}

/** @deprecated Use `useOrganiserEvents` instead. */
export const useEvents = useOrganiserEvents
