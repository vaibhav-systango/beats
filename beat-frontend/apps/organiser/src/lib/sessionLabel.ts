import type { EventSession } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

export function formatSessionLabel(session: EventSession, index: number): string {
  const city = session.eventAddress?.city?.trim()
  const dateLabel = session.startAt ? formatEventDateTime(session.startAt) : null

  if (city && dateLabel) {
    return `${city} · ${dateLabel}`
  }
  if (city) {
    return city
  }
  if (dateLabel) {
    return dateLabel
  }
  return `Session ${index + 1}`
}
