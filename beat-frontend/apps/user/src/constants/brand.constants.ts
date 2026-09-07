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
    description:
      'Discover live events near you — search by city, category, or vibe on Beats.',
  },
  EVENTS: {
    title: 'Events',
    description: 'Browse and filter live events across India on Beats.',
  },
  EVENT_DETAIL: {
    title: 'Event',
    description: 'Event details, schedule, and tickets on Beats.',
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
  HOME: 'Home',
  EVENTS: 'Events',
  SIGN_IN: 'Sign in',
  SIGN_OUT: 'Sign out',
} as const

export const HOME_COPY = {
  SEARCH_PLACEHOLDER: 'Search events, artists, venues…',
  SEARCH_CTA: 'Search',
  CITIES_HEADING: 'Popular cities',
  CATEGORIES_HEADING: 'Browse by category',
  POPULAR_HEADING: 'Popular events',
  POPULAR_EMPTY: 'No published events yet. Check back soon.',
  VIEW_ALL_EVENTS: 'View all events',
} as const

export const EVENTS_COPY = {
  SEARCH_PLACEHOLDER: 'Search events…',
  EMPTY: 'No events match your filters.',
  FILTER_ALL: 'All',
  FILTER_THIS_WEEK: 'This week',
  FILTER_THIS_WEEKEND: 'This weekend',
} as const

export const EVENT_DETAIL_COPY = {
  ABOUT: 'About',
  SESSIONS: 'Sessions',
  GET_TICKETS: 'Get tickets',
  TICKETS_FROM: 'Tickets from',
  RELATED_HEADING: 'More in',
  DATE_TBA: 'Date TBA',
  VENUE_TBA: 'Venue TBA',
  BACK_TO_EVENTS: 'Back to events',
} as const

export const ONBOARDING_COPY = {
  title: 'Set up your vibe',
  description: 'Tell us who you are so we can show you the best events.',
  submitLabel: 'Complete setup',
} as const

export const FALLBACK_CATEGORIES = [
  'Music',
  'Nightlife',
  'Sports',
  'Theatre',
  'Comedy',
  'Workshops',
] as const

/** Mirrors onboarding city list — kept local so home SSR does not import @beat/core auth clients. */
export const DISCOVERY_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Lucknow',
  'Kochi',
  'Goa',
  'Indore',
  'Bhopal',
  'Nagpur',
  'Surat',
  'Vadodara',
  'Coimbatore',
  'Visakhapatnam',
  'Guwahati',
  'Bhubaneswar',
  'Dehradun',
  'Noida',
  'Gurgaon',
] as const
