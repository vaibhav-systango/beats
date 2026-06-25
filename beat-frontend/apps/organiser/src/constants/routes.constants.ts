import { DASHBOARD_ROUTES } from '@beat/core'

export const ORGANISER_ROUTES = {
  EVENTS: 'events',
} as const

export const ORGANISER_PATHS = {
  EVENTS: `${DASHBOARD_ROUTES.DASHBOARD}/${ORGANISER_ROUTES.EVENTS}`,
} as const
