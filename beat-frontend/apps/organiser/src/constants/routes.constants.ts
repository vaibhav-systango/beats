import { DASHBOARD_ROUTES } from '@beat/core'

import type { EventEditorStep } from './event-editor.constants'

export const ORGANISER_ROUTES = {
  EVENTS: 'events',
  EVENT_CREATE: 'events/new',
  EVENT_DETAIL: 'events/:id/*',
} as const

export interface EventStepPathOptions {
  sessionId?: string
}

export const ORGANISER_PATHS = {
  EVENTS: `${DASHBOARD_ROUTES.DASHBOARD}/${ORGANISER_ROUTES.EVENTS}`,
  EVENT_CREATE: `${DASHBOARD_ROUTES.DASHBOARD}/${ORGANISER_ROUTES.EVENT_CREATE}`,
  eventDetail: (id: string) => `${DASHBOARD_ROUTES.DASHBOARD}/events/${id}`,
  eventStep: (id: string, step: EventEditorStep, options?: EventStepPathOptions) => {
    const base = `${DASHBOARD_ROUTES.DASHBOARD}/events/${id}/${step}`
    if (options?.sessionId) {
      return `${base}?sessionId=${encodeURIComponent(options.sessionId)}`
    }
    return base
  },
} as const
