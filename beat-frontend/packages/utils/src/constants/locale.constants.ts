export const LOCALE_CONSTANTS = {
  DEFAULT: 'en-IN',
} as const

export const DATE_FORMAT_OPTIONS = {
  DATE: {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
  TIME: {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
} as const satisfies {
  DATE: Intl.DateTimeFormatOptions
  TIME: Intl.DateTimeFormatOptions
}
