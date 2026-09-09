import type { Event, SessionMode } from '@beat/types'

import { DISCOVERY_CITY_COORDINATES } from './discoveryCities'

export type EventsWhenFilter = 'all' | 'this-week' | 'this-weekend' | 'tonight'

export type VenueTypeFilter = 'all' | SessionMode

export type EventsBrowseParams = {
  q?: string
  city?: string
  category?: string
  when?: EventsWhenFilter
  minPrice?: number
  maxPrice?: number
  venueType?: VenueTypeFilter
  distanceKm?: number
  lat?: number
  lng?: number
}

const DISCOVERY_PREFS_KEY = 'beats.discovery.prefs'

export type DiscoveryPrefs = {
  city?: string
  lat?: number
  lng?: number
  radiusKm?: number
}

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

export function getTonightRange(now = new Date()): { from: number; to: number } {
  return { from: now.getTime(), to: endOfDay(now).getTime() }
}

export function matchesWhenFilter(
  startAt: number | undefined,
  when: EventsWhenFilter
): boolean {
  if (when === 'all') return true
  if (typeof startAt !== 'number') return false

  const range =
    when === 'tonight'
      ? getTonightRange()
      : when === 'this-week'
        ? getThisWeekRange()
        : getThisWeekendRange()
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
  if (
    value === 'this-week' ||
    value === 'this-weekend' ||
    value === 'tonight'
  ) {
    return value
  }
  return 'all'
}

export function parseVenueTypeFilter(value: string | undefined): VenueTypeFilter {
  if (value === 'OFFLINE' || value === 'ONLINE' || value === 'HYBRID') return value
  return 'all'
}

/** Server-side date bounds for the public discovery `dateFrom` / `dateTo` query. */
export function getWhenDateRange(
  when: EventsWhenFilter,
  now = new Date()
): { dateFrom?: number; dateTo?: number } {
  if (when === 'all') return {}
  const range =
    when === 'tonight'
      ? getTonightRange(now)
      : when === 'this-week'
        ? getThisWeekRange(now)
        : getThisWeekendRange(now)
  return { dateFrom: range.from, dateTo: range.to }
}

export function formatTicketPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function cityCoordinates(
  city: string | undefined
): { lat: number; lng: number } | null {
  if (!city?.trim()) return null
  const coords = DISCOVERY_CITY_COORDINATES[city.trim()]
  if (!coords) return null
  return { lat: coords.latitude, lng: coords.longitude }
}

export function readDiscoveryPrefs(): DiscoveryPrefs {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DISCOVERY_PREFS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DiscoveryPrefs
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writeDiscoveryPrefs(prefs: DiscoveryPrefs): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DISCOVERY_PREFS_KEY, JSON.stringify(prefs))
}

export function buildEventsHref(params: EventsBrowseParams): string {
  const search = new URLSearchParams()
  if (params.q?.trim()) search.set('q', params.q.trim())
  if (params.city?.trim()) search.set('city', params.city.trim())
  if (params.category?.trim()) search.set('category', params.category.trim())
  if (params.when && params.when !== 'all') search.set('when', params.when)
  if (params.minPrice != null && Number.isFinite(params.minPrice)) {
    search.set('minPrice', String(params.minPrice))
  }
  if (params.maxPrice != null && Number.isFinite(params.maxPrice)) {
    search.set('maxPrice', String(params.maxPrice))
  }
  if (params.venueType && params.venueType !== 'all') {
    search.set('venueType', params.venueType)
  }
  if (params.distanceKm != null && Number.isFinite(params.distanceKm) && params.distanceKm > 0) {
    search.set('distanceKm', String(params.distanceKm))
  }
  if (params.lat != null && Number.isFinite(params.lat)) {
    search.set('lat', String(params.lat))
  }
  if (params.lng != null && Number.isFinite(params.lng)) {
    search.set('lng', String(params.lng))
  }
  const query = search.toString()
  return query ? `/events?${query}` : '/events'
}

export function buildHomeHref(params: EventsBrowseParams): string {
  const search = new URLSearchParams()
  if (params.city?.trim()) search.set('city', params.city.trim())
  if (params.category?.trim()) search.set('category', params.category.trim())
  if (params.when && params.when !== 'all') search.set('when', params.when)
  if (params.lat != null && Number.isFinite(params.lat)) search.set('lat', String(params.lat))
  if (params.lng != null && Number.isFinite(params.lng)) search.set('lng', String(params.lng))
  if (params.distanceKm != null && params.distanceKm > 0) {
    search.set('distanceKm', String(params.distanceKm))
  }
  const query = search.toString()
  return query ? `/?${query}` : '/'
}

export function radiusParam(distanceKm: number | undefined): string | undefined {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm <= 0) return undefined
  return `${Math.round(distanceKm)}km`
}

export const REFERRAL_STORAGE_KEY = 'beats.checkout.referrerUserId'

export function captureReferrerFromSearch(search: string): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(search)
  const ref =
    params.get('ref')?.trim() ||
    params.get('referrer')?.trim() ||
    params.get('referrerUserId')?.trim()
  if (!ref) return null
  window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, ref)
  return ref
}

export function readStoredReferrerUserId(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(REFERRAL_STORAGE_KEY)?.trim() || null
}

export function clearStoredReferrerUserId(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
}
