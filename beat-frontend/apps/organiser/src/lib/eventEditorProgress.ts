import type { Event, EventSession } from '@beat/types'

import {
  validateCapacity,
  validateEventDescription,
  validateEventName,
} from '@/lib/validation'

export function isBasicInfoComplete(event: Event, session?: EventSession): boolean {
  if (!session) {
    return false
  }

  if (validateEventName(event.title)) {
    return false
  }

  if (validateEventDescription(event.description)) {
    return false
  }

  if (validateCapacity(session.capacity)) {
    return false
  }

  if (!session.categoryIds?.length) {
    return false
  }

  if (!session.startAt || !session.endAt || session.endAt <= session.startAt) {
    return false
  }

  if (session.mode === 'OFFLINE' || session.mode === 'HYBRID' || !session.mode) {
    if (!session.eventAddress?.city?.trim()) {
      return false
    }
    if (!session.eventAddress?.venueName?.trim()) {
      return false
    }
  }

  return true
}

export function isMediaComplete(session?: EventSession): boolean {
  return Boolean(session?.eventSessionMedias?.cover?.url)
}

export function isTicketsComplete(session?: EventSession): boolean {
  return Boolean(session?.ticketTypes?.length)
}
