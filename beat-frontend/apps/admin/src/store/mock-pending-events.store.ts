import { create } from 'zustand'

import type { AdminEventDetail, AdminEventListItem } from '@/mocks/admin-event.types'
import { MOCK_PENDING_EVENTS, getMockEventById } from '@/mocks/events.mock'

interface MockPendingEventsState {
  events: AdminEventListItem[]
  removeEvent: (id: string) => void
  getPendingEventDetail: (id: string) => AdminEventDetail | undefined
}

export const useMockPendingEventsStore = create<MockPendingEventsState>((set, get) => ({
  events: MOCK_PENDING_EVENTS,
  removeEvent: (id) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }))
  },
  getPendingEventDetail: (id) => {
    const isPending = get().events.some((event) => event.id === id)
    if (!isPending) {
      return undefined
    }

    return getMockEventById(id)
  },
}))
