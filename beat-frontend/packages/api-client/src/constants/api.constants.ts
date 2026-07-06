export const API_V1_PREFIX = '/api/v1' as const

export const API_CONSTANTS = {
  EVENTS_LIST: `${API_V1_PREFIX}/events`,
  EVENTS_CREATE: `${API_V1_PREFIX}/events`,
  EVENTS_MY: `${API_V1_PREFIX}/events/my-events`,
  EVENT_BY_ID: (id: string) => `${API_V1_PREFIX}/events/${id}`,
  EVENT_SUBMIT: (id: string) => `${API_V1_PREFIX}/events/${id}/submit`,
  EVENT_SESSIONS: (eventId: string) => `${API_V1_PREFIX}/events/${eventId}/sessions`,
  EVENT_SESSION: (eventId: string, sessionId: string) =>
    `${API_V1_PREFIX}/events/${eventId}/sessions/${sessionId}`,
  /** @deprecated Use EVENTS_MY */
  ORGANISER_EVENTS: `${API_V1_PREFIX}/events/my-events`,
  AUTH_SEND_OTP: '/auth/send-otp',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_REFRESH_TOKEN: '/auth/refresh-token',
  USERS_ONBOARDING: '/users',
  EVENT_CATEGORIES: `${API_V1_PREFIX}/event-categories`,
} as const
