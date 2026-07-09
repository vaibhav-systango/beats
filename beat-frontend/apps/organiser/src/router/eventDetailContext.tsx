import type { Event, EventSession } from '@beat/types'
import { createContext, useContext } from 'react'

import type { EventEditorStep } from '@/constants'

export interface EventDetailContextValue {
  event: Event
  eventId: string
  sessions: EventSession[]
  session: EventSession | undefined
  sessionId: string | undefined
  navigateToStep: (step: EventEditorStep) => void
}

const EventDetailContext = createContext<EventDetailContextValue | null>(null)

export function useEventDetailContext(): EventDetailContextValue {
  const value = useContext(EventDetailContext)
  if (!value) {
    throw new Error('useEventDetailContext must be used within EventDetailLayout')
  }
  return value
}

export { EventDetailContext }
