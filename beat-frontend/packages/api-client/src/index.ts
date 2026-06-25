export { API_CONSTANTS } from './constants/api.constants'

export { apiClient, normalizeError } from './axios/axios'

export {
  normalizeApiResponse,
  createApiResponseNormalizer,
  normalizePaginatedGetResponse,
  createPaginatedGetResponseNormalizer,
} from './lib/normalizeApiResponse'
export type { NormalizableSchema } from './lib/normalizeApiResponse'

export {
  extractApiErrorMessage,
  apiFailureMessage,
  rethrowWithApiMessage,
} from './lib/apiErrorMessage'

export { queryClient } from './lib/queryClient'
export { getAccessToken, saveAccessToken, clearAccessToken } from './lib/tokenStorage'

export { QueryProvider } from './providers/QueryProvider'

export { QUERY_KEYS } from './services/queryKeys'

export {
  fetchEvents,
  getEvents,
  createEvent,
  useEventsList,
  useCreateEventMutation,
  sendOtp,
  useSendOtp,
} from './services/common'
export type {
  CreateEventInput,
  CreateEventResponse,
  EventsListResponse,
  EventsListView,
  GetEventsParams,
  UseEventsListParams,
  SendOtpRequestBody,
  SendOtpResponse,
} from './services/common'

export {
  fetchOrganiserEvents,
  getOrganiserEvents,
  useEvents,
  useOrganiserEvents,
} from './services/organiser'
export type {
  OrganiserEventsResponse,
  OrganiserEventsView,
  UseOrganiserEventsParams,
} from './services/organiser'
