import type { GetEventsParams } from '@beat/types'

export const QUERY_KEYS = {
  COMMON: {
    EVENTS: {
      all: () => ['beat', 'common', 'events'] as const,
      list: (params: GetEventsParams) =>
        ['beat', 'common', 'events', 'list', params] as const,
    },
    AUTH: {
      sendOtp: () => ['beat', 'common', 'auth', 'sendOtp'] as const,
      verifyOtp: () => ['beat', 'common', 'auth', 'verifyOtp'] as const,
    },
    EVENT_CATEGORIES: {
      all: () => ['beat', 'common', 'event-categories'] as const,
      list: (params: { limit?: number; offset?: number }) =>
        ['beat', 'common', 'event-categories', 'list', params] as const,
    },
  },
  ORGANISER: {
    EVENTS: {
      all: () => ['beat', 'organiser', 'events'] as const,
      list: (page: number, limit: number) =>
        ['beat', 'organiser', 'events', 'list', page, limit] as const,
    },
  },
} as const
