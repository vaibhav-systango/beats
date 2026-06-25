import { DASHBOARD_ROUTES } from '@beat/core'

export const ADMIN_ROUTES = {
  MODERATION: 'moderation',
} as const

export const ADMIN_PATHS = {
  MODERATION: `${DASHBOARD_ROUTES.DASHBOARD}/${ADMIN_ROUTES.MODERATION}`,
} as const
