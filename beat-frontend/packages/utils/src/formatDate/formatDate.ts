const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}

export function formatEventDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('en-IN', DATE_FORMAT)
}

export function formatEventTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('en-IN', TIME_FORMAT)
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
    return 'Ongoing'
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  }
  if (diffDays === 1) {
    return 'Tomorrow'
  }
  return `${diffDays} days away`
}
