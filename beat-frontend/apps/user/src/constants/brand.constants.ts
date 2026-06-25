export const BRAND_CONSTANTS = {
  NAME: 'Beats',
  NAME_UPPERCASE: 'BEATS',
  TAGLINE_LINE_1: 'Where the city',
  TAGLINE_LINE_2: 'comes alive.',
  HERO_DESCRIPTION:
    'The only ticketing platform you need for exclusive underground gigs, festivals, and live experiences.',
  DEFAULT_TITLE: 'Beats — Event Ticketing Platform',
  TITLE_TEMPLATE: '%s | Beats',
  DEFAULT_DESCRIPTION:
    'Discover and book tickets for concerts, festivals, sports, and live events across India.',
} as const

export const PAGE_METADATA = {
  HOME: {
    title: 'Home',
    description: 'Beat event ticketing platform',
  },
  EVENTS: {
    title: 'Events',
    description: 'Browse events on Beat',
  },
  LOGIN: {
    title: 'Sign in',
    description: 'Sign in to Beats with your phone number',
  },
  ONBOARDING: {
    title: 'Welcome',
    description: 'Complete your Beats profile',
  },
} as const

export const NAV_LABELS = {
  EVENTS: 'Events',
  SIGN_IN: 'Sign in',
} as const

export const HOME_COPY = {
  DESCRIPTION_PREFIX: 'Discover and book tickets for concerts, festivals, and live events. See',
  EVENTS_ROUTE: '/events',
  DESCRIPTION_SUFFIX: 'for SSR + @beat/api-client usage.',
} as const

export const ONBOARDING_COPY = {
  TITLE: 'Welcome to Beats',
  DESCRIPTION: 'Onboarding flow coming soon. You are signed in.',
} as const
