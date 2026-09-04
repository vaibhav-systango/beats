import type { AdminEventsTab, GetEventsParams } from '@beat/types'

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
    STORAGE: {
      all: () => ['beat', 'common', 'storage'] as const,
      signedUrl: (key: string) =>
        ['beat', 'common', 'storage', 'signedUrl', key] as const,
    },
  },
  ORGANISER: {
    EVENTS: {
      all: () => ['beat', 'organiser', 'events'] as const,
      list: (page: number, limit: number) =>
        ['beat', 'organiser', 'events', 'list', page, limit] as const,
      detail: (id: string) =>
        ['beat', 'organiser', 'events', 'detail', id] as const,
    },
  },
  ADMIN: {
    EVENTS: {
      all: () => ['beat', 'admin', 'events'] as const,
      list: (tab: AdminEventsTab, page: number, limit: number) =>
        ['beat', 'admin', 'events', 'list', tab, page, limit] as const,
      /** @deprecated Use list('pending', page, limit) */
      pending: (page: number, limit: number) =>
        ['beat', 'admin', 'events', 'list', 'pending', page, limit] as const,
      detail: (id: string) => ['beat', 'admin', 'events', 'detail', id] as const,
    },
  },
} as const
