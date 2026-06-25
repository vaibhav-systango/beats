import type { EventStatus } from '@beat/types'

export const EVENT_DEFAULTS = {
  STATUS: 'DRAFT' as EventStatus,
} as const
