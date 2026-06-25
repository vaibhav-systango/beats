import { ORGANISER_PATHS } from './routes.constants'

export const ORGANISER_NAVIGATION = {
  APP_TITLE: 'Beat Organiser',
  LINKS: [{ to: ORGANISER_PATHS.EVENTS, label: 'Events' }],
} as const
