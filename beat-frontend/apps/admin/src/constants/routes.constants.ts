import { DASHBOARD_ROUTES } from '@beat/core'

export const ADMIN_ROUTES = {
  EVENTS: 'events',
  EVENT_DETAIL: 'events/:id',
  MODERATION: 'moderation',
} as const

export const ADMIN_PATHS = {
  EVENTS: `${DASHBOARD_ROUTES.DASHBOARD}/${ADMIN_ROUTES.EVENTS}`,
  eventDetail: (id: string) => `${DASHBOARD_ROUTES.DASHBOARD}/events/${id}`,
  MODERATION: `${DASHBOARD_ROUTES.DASHBOARD}/${ADMIN_ROUTES.MODERATION}`,
} as const
