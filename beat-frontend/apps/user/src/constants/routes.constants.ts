export const USER_ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id.trim()}`,
  EVENT_TICKETS: (id: string) => `/events/${id.trim()}/tickets`,
  PAYMENT_RECEIPT: (paymentId: string) => `/payments/${paymentId.trim()}/receipt`,
  TICKET: (ticketId: string) => `/tickets/${ticketId.trim()}`,
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
} as const
