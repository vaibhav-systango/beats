import { DASHBOARD_ROUTES } from '@beat/core'

export const ORGANISER_ROUTES = {
  EVENTS: 'events',
  EVENT_CREATE: 'events/new',
  EVENT_DETAIL: 'events/:id',
} as const

export const ORGANISER_PATHS = {
  EVENTS: `${DASHBOARD_ROUTES.DASHBOARD}/${ORGANISER_ROUTES.EVENTS}`,
  EVENT_CREATE: `${DASHBOARD_ROUTES.DASHBOARD}/${ORGANISER_ROUTES.EVENT_CREATE}`,
  eventDetail: (id: string) =>
    `${DASHBOARD_ROUTES.DASHBOARD}/events/${id}`,
} as const
