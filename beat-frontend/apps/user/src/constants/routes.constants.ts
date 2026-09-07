export const USER_ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id.trim()}`,
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
} as const
