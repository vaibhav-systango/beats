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
  EVENT_TICKETS: {
    title: 'Tickets',
    description: 'Get tickets for this event on Beats.',
  },
  PAYMENT_RECEIPT: {
    title: 'Payment receipt',
    description: 'Your Beats ticket receipt and QR codes.',
  },
  TICKET: {
    title: 'Ticket',
    description: 'Beats ticket details',
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
  FEED_HEADING: 'Near you',
  POPULAR_EMPTY: 'No published events yet. Check back soon.',
  FEED_EMPTY: 'No events match this city, date, or location.',
  VIEW_ALL_EVENTS: 'View all events',
  CITY_LABEL: 'City',
  CITY_ANY: 'Any city',
  CATEGORY_LABEL: 'Category',
  CATEGORY_ANY: 'Any category',
  DATE_LABEL: 'When',
  FILTER_ALL: 'Any time',
  FILTER_TONIGHT: 'Tonight',
  FILTER_THIS_WEEK: 'This week',
  FILTER_THIS_WEEKEND: 'This weekend',
  USE_SAVED_LOCATION: 'Use saved location',
  LOCATION_DETECTING: 'Detecting your location…',
  LOCATION_APPLIED: 'Showing events near your current location.',
  LOCATION_SAVED_APPLIED: 'Using your saved discovery location.',
  LOCATION_DENIED: 'Location permission denied. Choose a city instead.',
  LOCATION_UNAVAILABLE: 'Geolocation is not available in this browser.',
  ACTIVE_CITY: 'Filtering by',
  ACTIVE_GEO: 'Filtering by your location',
  EXPLORE_MORE: 'Explore more',
  RESULTS_FOR: 'Events in',
  CLEAR_FILTERS: 'Clear filters',
} as const

export const EVENTS_COPY = {
  SEARCH_PLACEHOLDER: 'Search events…',
  EMPTY: 'No events match your filters.',
  FILTER_ALL: 'All',
  FILTER_THIS_WEEK: 'This week',
  FILTER_THIS_WEEKEND: 'This weekend',
  FILTER_TONIGHT: 'Tonight',
  PRICE_LABEL: 'Price (₹)',
  PRICE_MIN: 'Min',
  PRICE_MAX: 'Max',
  VENUE_TYPE_LABEL: 'Venue type',
  VENUE_ANY: 'Any',
  VENUE_OFFLINE: 'In person',
  VENUE_ONLINE: 'Online',
  VENUE_HYBRID: 'Hybrid',
  DISTANCE_LABEL: 'Distance (km)',
  APPLY_FILTERS: 'Apply filters',
  CLEAR_FILTERS: 'Clear filters',
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
  TAB_OVERVIEW: 'Overview',
  TAB_TICKETS: 'Tickets',
  TAB_RESALE: 'Resale',
  TAB_FAQ: 'FAQ',
  MAP_HEADING: 'Map',
  MAP_MISSING: 'Map location is not available for this event yet.',
  LINEUP_HEADING: 'Lineup',
  LINEUP_EMPTY: 'Lineup will be announced soon.',
  FAQ_EMPTY: 'No FAQs published for this event yet.',
  RESALE_COMING_SOON: 'Resale is coming soon for this event.',
  TICKETS_TAB_HINT: 'Choose a ticket type and continue to checkout.',
  TICKETS_SIGN_IN_REQUIRED:
    'Sign in to view ticket types and complete checkout.',
  SIGN_IN_TO_BUY: 'Sign in to buy tickets',
} as const

export const EVENT_TICKETS_COPY = {
  TITLE: 'Get tickets',
  DESCRIPTION: 'Choose your tickets and pay securely with Razorpay.',
  BACK_TO_EVENT: 'Back to event',
  BACK_TO_EVENTS: 'Back to events',
  SESSION_LABEL: 'Session',
  LOADING: 'Loading event…',
  LOADING_TICKETS: 'Loading tickets…',
  EMPTY: 'No tickets are available for this session yet.',
  EVENT_MISSING: 'Event not found.',
  SELECT_TICKETS: 'Select at least one ticket to continue.',
  TOTAL: 'Total',
  PAY_CTA: 'Pay with Razorpay',
  PROCESSING: 'Processing…',
  SIGN_IN_HINT: 'You’ll sign in before checkout if needed.',
  SUCCESS: 'Payment successful — your tickets are confirmed.',
  SUCCESS_FREE: 'Booking confirmed — no payment required.',
  GUEST_DETAILS_HEADING: 'Guest details',
  GUEST_DETAILS_HINT: 'Enter details for each ticket as required by the organiser.',
  GUEST_NAME: 'Guest name',
  GUEST_AGE: 'Guest age',
  GUEST_REQUIRED: 'Please complete required guest details.',
  ORDER_SUMMARY: 'Order summary',
  FACE_VALUE: 'Ticket face value',
  TAXES: 'Taxes',
  TAXES_INCLUDED: 'Included in ticket price',
  BEAT_CREDITS: 'Beat Credits',
  BEAT_CREDITS_EARN: 'You’ll earn approximately',
  BEAT_CREDITS_BURN: 'Apply Beat Credits',
  BEAT_CREDITS_UNAVAILABLE: 'No Beat Credits available yet',
  PAYMENT_METHOD: 'Payment method',
  PAYMENT_RAZORPAY: 'Razorpay',
  REFERRAL_BADGE: 'Referred purchase',
  CONTINUE_GUESTS: 'Continue',
  BACK_TO_TICKETS: 'Back to tickets',
} as const

export const RECEIPT_COPY = {
  TITLE: 'Payment receipt',
  SUBTITLE: 'Show these QR codes at the entrance.',
  LOADING: 'Loading receipt…',
  MISSING: 'Receipt not found.',
  PAID: 'Paid',
  FREE: 'Confirmed',
  TICKETS_HEADING: 'Your tickets',
  TICKETS_PENDING: 'Tickets are being issued. Refresh in a moment.',
  SCAN_HINT: 'Scan any QR to open that ticket.',
  BACK_HOME: 'Back to home',
  BACK_EVENTS: 'Browse events',
  TICKET_ID: 'Ticket ID',
  STATUS: 'Status',
  SIGN_IN_REQUIRED: 'Sign in to view this receipt.',
  REFERRAL_REWARD:
    'Referral reward applied — thanks for purchasing through an invite link.',
  GUEST_LABEL: 'Guest',
  OWNED_BY: 'Owned by',
} as const

export const TICKET_SCAN_COPY = {
  TITLE: 'Ticket',
  LOADING: 'Loading ticket…',
  MISSING: 'This ticket could not be found.',
  VALID: 'Valid ticket',
  VOID: 'Void / refunded',
  OWNED_BY: 'Owned by',
  BACK_HOME: 'Back to home',
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
