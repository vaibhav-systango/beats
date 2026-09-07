import type { Event } from '@beat/types'

export type EventsWhenFilter = 'all' | 'this-week' | 'this-weekend'

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

/** Monday–Sunday window containing today. */
export function getThisWeekRange(now = new Date()): { from: number; to: number } {
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = startOfDay(new Date(now))
  monday.setDate(now.getDate() + mondayOffset)
  const sunday = endOfDay(new Date(monday))
  sunday.setDate(monday.getDate() + 6)
  return { from: monday.getTime(), to: sunday.getTime() }
}

/** Friday–Sunday window for the current/upcoming weekend. */
export function getThisWeekendRange(now = new Date()): { from: number; to: number } {
  const day = now.getDay()
  const friday = startOfDay(new Date(now))

  if (day === 0) {
    friday.setDate(now.getDate() - 2)
  } else if (day === 6) {
    friday.setDate(now.getDate() - 1)
  } else if (day < 5) {
    friday.setDate(now.getDate() + (5 - day))
  }

  const sunday = endOfDay(new Date(friday))
  sunday.setDate(friday.getDate() + 2)
  return { from: friday.getTime(), to: sunday.getTime() }
}

export function matchesWhenFilter(
  startAt: number | undefined,
  when: EventsWhenFilter
): boolean {
  if (when === 'all') return true
  if (typeof startAt !== 'number') return false

  const range = when === 'this-week' ? getThisWeekRange() : getThisWeekendRange()
  return startAt >= range.from && startAt <= range.to
}

export function filterEventsByWhen(
  events: Event[],
  when: EventsWhenFilter
): Event[] {
  if (when === 'all') return events
  return events.filter((event) => matchesWhenFilter(event.startAt, when))
}

export function parseWhenFilter(value: string | undefined): EventsWhenFilter {
  if (value === 'this-week' || value === 'this-weekend') return value
  return 'all'
}

/** Server-side date bounds for the public discovery `dateFrom` / `dateTo` query. */
export function getWhenDateRange(
  when: EventsWhenFilter,
  now = new Date()
): { dateFrom?: number; dateTo?: number } {
  if (when === 'all') return {}
  const range = when === 'this-week' ? getThisWeekRange(now) : getThisWeekendRange(now)
  return { dateFrom: range.from, dateTo: range.to }
}

export function formatTicketPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function buildEventsHref(params: {
  q?: string
  city?: string
  category?: string
  when?: EventsWhenFilter
}): string {
  const search = new URLSearchParams()
  if (params.q?.trim()) search.set('q', params.q.trim())
  if (params.city?.trim()) search.set('city', params.city.trim())
  if (params.category?.trim()) search.set('category', params.category.trim())
  if (params.when && params.when !== 'all') search.set('when', params.when)
  const query = search.toString()
  return query ? `/events?${query}` : '/events'
}
