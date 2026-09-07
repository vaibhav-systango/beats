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
  ApiClientError,
  extractApiErrorMessage,
  apiFailureMessage,
  getApiErrorMessage,
  getApiErrorStatusCode,
  isAxiosLikeWithResponseData,
  isNotFoundApiError,
  rethrowWithApiMessage,
} from './lib/apiErrorMessage'

export { queryClient } from './lib/queryClient'

export { QueryProvider } from './providers/QueryProvider'

export { QUERY_KEYS } from './services/queryKeys'

export {
  fetchEvents,
  getEvents,
  createEvent,
  fetchPublicEventById,
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
  fetchSignedUrl,
  useSignedMediaUrl,
  SignedMediaImage,
  STORAGE_SIGNED_URL_MAX_EXPIRES_IN_SECONDS,
  isDirectMediaUrl,
  needsSignedMediaUrl,
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
  SignedUrlRequestBody,
  SignedUrlResponse,
  SignedMediaImageProps,
  UseSignedMediaUrlResult,
} from './services/common'

export {
  fetchOrganiserEvents,
  getOrganiserEvents,
  fetchEventById,
  createOrganiserEvent,
  updateEvent,
  submitEvent,
  createEventSession,
  deleteEventSession,
  updateEventSession,
  useEvents,
  useOrganiserEvents,
  useEventDetails,
  useCreateOrganiserEvent,
  useUpdateEvent,
  useSubmitEvent,
  useCreateEventSession,
  useUpdateEventSession,
  useDeleteEventSession,
} from './services/organiser'
export type {
  OrganiserEventsResponse,
  OrganiserEventsView,
  UseOrganiserEventsParams,
  SubmitEventResult,
} from './services/organiser'

export {
  fetchAdminEvents,
  fetchAdminPendingEvents,
  fetchAdminEventDetails,
  reviewEvent,
  useAdminEvents,
  useAdminPendingEvents,
  useAdminEventDetails,
  useReviewEvent,
} from './services/admin'
export type {
  UseAdminPendingEventsParams,
  ReviewEventResponse,
  ReviewEventMutationInput,
} from './services/admin'
export type {
  AdminEventsTab,
  AdminEventsListFilter,
  AdminEventsListParams,
  adminEventsTabToStatusFilter,
} from '@beat/types'
