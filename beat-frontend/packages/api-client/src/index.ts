export { API_CONSTANTS } from './constants/api.constants'
export { CONFIG_CONSTANTS } from './constants/config.constants'
export { ERROR_CONSTANTS } from './constants/error.constants'
export { PAGINATION_CONSTANTS } from './constants/pagination.constants'
export { STORAGE_CONSTANTS } from './constants/storage.constants'

export {
  getAccessToken,
  saveAccessToken,
  getRefreshToken,
  saveRefreshToken,
  clearAccessToken,
  clearRefreshToken,
  clearAuthSession,
} from './lib/tokenStorage'

export {
  registerSessionExpiredHandler,
  handleSessionExpired,
} from './lib/authSession'

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

export { QueryProvider } from './providers/QueryProvider'

export { QUERY_KEYS } from './services/queryKeys'

export {
  fetchEvents,
  getEvents,
  createEvent,
  useEventsList,
  useCreateEventMutation,
  sendOtp,
  verifyOtp,
  useSendOtp,
  useVerifyOtp,
  onboardUser,
  useOnboardUser,
  getEventCategories,
  fetchEventCategories,
  useEventCategories,
} from './services/common'
export type {
  CreateEventInput,
  CreateEventResponse,
  EventsListResponse,
  EventsListView,
  GetEventsParams,
  UseEventsListParams,
  DeliveryMethod,
  SendOtpRequestBody,
  SendOtpResponse,
  VerifyOtpRequestBody,
  VerifyOtpResponse,
  VerifyOtpAccount,
  OnboardUserRequestBody,
  OnboardUserResponse,
  OnboardingLocation,
  EventCategoriesListResponse,
  GetEventCategoriesParams,
} from './services/common'

export {
  fetchOrganiserEvents,
  getOrganiserEvents,
  fetchEventById,
  createOrganiserEvent,
  updateEvent,
  submitEvent,
  createEventSession,
  updateEventSession,
  useEvents,
  useOrganiserEvents,
  useEventDetails,
  useCreateOrganiserEvent,
  useUpdateEvent,
  useSubmitEvent,
  useCreateEventSession,
  useUpdateEventSession,
} from './services/organiser'
export type {
  OrganiserEventsResponse,
  OrganiserEventsView,
  UseOrganiserEventsParams,
  SubmitEventResult,
} from './services/organiser'
