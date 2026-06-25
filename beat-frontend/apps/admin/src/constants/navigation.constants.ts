import { ADMIN_PATHS } from './routes.constants'

export const ADMIN_NAVIGATION = {
  APP_TITLE: 'Beat Admin',
  LINKS: [{ to: ADMIN_PATHS.MODERATION, label: 'Event Moderation' }],
} as const
