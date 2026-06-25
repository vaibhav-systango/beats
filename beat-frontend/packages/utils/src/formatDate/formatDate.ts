import { DATE_LABELS } from '../constants/dateLabels.constants'
import { DATE_FORMAT_OPTIONS, LOCALE_CONSTANTS } from '../constants/locale.constants'

export function formatEventDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(
    LOCALE_CONSTANTS.DEFAULT,
    DATE_FORMAT_OPTIONS.DATE
  )
}

export function formatEventTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(
    LOCALE_CONSTANTS.DEFAULT,
    DATE_FORMAT_OPTIONS.TIME
  )
}

export function formatEventDateTime(epochMs: number): string {
  return `${formatEventDate(epochMs)} • ${formatEventTime(epochMs)}`
}

export function isEventPast(epochMs: number): boolean {
  return epochMs < Date.now()
}

export function timeUntilEvent(epochMs: number): string {
  const now = Date.now()
  const diffMs = epochMs - now

  if (diffMs <= 0) {
    return DATE_LABELS.ONGOING
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return DATE_LABELS.TODAY
  }
  if (diffDays === 1) {
    return DATE_LABELS.TOMORROW
  }
  return DATE_LABELS.DAYS_AWAY(diffDays)
}
