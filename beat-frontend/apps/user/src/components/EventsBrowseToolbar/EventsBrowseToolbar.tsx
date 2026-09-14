'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

import { Button, Input } from '@/components/ui'
import { DISCOVERY_CITIES, EVENTS_COPY, HOME_COPY } from '@/constants'
import {
  buildEventsHref,
  cityCoordinates,
  type EventsBrowseParams,
  type EventsWhenFilter,
  type VenueTypeFilter,
} from '@/lib'

type EventsBrowseToolbarProps = EventsBrowseParams & {
  when: EventsWhenFilter
  resultCount?: number
}

const WHEN_OPTIONS: Array<{ value: EventsWhenFilter; label: string }> = [
  { value: 'all', label: EVENTS_COPY.WHEN_ANY },
  { value: 'tonight', label: EVENTS_COPY.WHEN_TODAY },
  { value: 'this-week', label: EVENTS_COPY.FILTER_THIS_WEEK },
  { value: 'this-weekend', label: EVENTS_COPY.WHEN_WEEKEND },
]

const VENUE_OPTIONS: Array<{ value: VenueTypeFilter; label: string }> = [
  { value: 'all', label: EVENTS_COPY.VENUE_ANY },
  { value: 'OFFLINE', label: EVENTS_COPY.VENUE_OFFLINE },
  { value: 'ONLINE', label: EVENTS_COPY.VENUE_ONLINE },
  { value: 'HYBRID', label: EVENTS_COPY.VENUE_HYBRID },
]

const FIELD_CLASS =
  'h-11 rounded-full border-border bg-card text-foreground placeholder:text-muted-foreground'

export function EventsBrowseToolbar({
  q = '',
  city,
  category,
  when,
  minPrice,
  maxPrice,
  venueType = 'all',
  distanceKm,
  lat,
  lng,
  resultCount,
}: EventsBrowseToolbarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(q)
  const [cityValue, setCityValue] = useState(city ?? '')
  const [minPriceInput, setMinPriceInput] = useState(
    minPrice != null ? String(minPrice) : ''
  )
  const [maxPriceInput, setMaxPriceInput] = useState(
    maxPrice != null ? String(maxPrice) : ''
  )
  const [venue, setVenue] = useState<VenueTypeFilter>(venueType)

  useEffect(() => {
    setQuery(q)
    setCityValue(city ?? '')
    setMinPriceInput(minPrice != null ? String(minPrice) : '')
    setMaxPriceInput(maxPrice != null ? String(maxPrice) : '')
    setVenue(venueType)
  }, [q, city, minPrice, maxPrice, venueType])

  function currentParams(
    overrides: Partial<EventsBrowseParams> = {}
  ): EventsBrowseParams {
    const parsedMin = Number(minPriceInput)
    const parsedMax = Number(maxPriceInput)
    const nextCity =
      overrides.city !== undefined ? overrides.city : cityValue || undefined
    const coords = nextCity ? cityCoordinates(nextCity) : undefined
    const nextLat =
      overrides.lat !== undefined
        ? overrides.lat
        : (coords?.lat ?? (nextCity ? undefined : lat))
    const nextLng =
      overrides.lng !== undefined
        ? overrides.lng
        : (coords?.lng ?? (nextCity ? undefined : lng))

    return {
      q: query,
      city: nextCity,
      category,
      when,
      minPrice: Number.isFinite(parsedMin) && minPriceInput ? parsedMin : undefined,
      maxPrice: Number.isFinite(parsedMax) && maxPriceInput ? parsedMax : undefined,
      venueType: venue,
      distanceKm:
        nextLat != null && nextLng != null ? (distanceKm ?? 25) : undefined,
      lat: nextLat,
      lng: nextLng,
      ...overrides,
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(buildEventsHref(currentParams()))
  }

  function onCityChange(nextCity: string) {
    setCityValue(nextCity)
    const coords = nextCity ? cityCoordinates(nextCity) : undefined
    router.push(
      buildEventsHref(
        currentParams({
          city: nextCity || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
          distanceKm: coords ? distanceKm ?? 25 : undefined,
        })
      )
    )
  }

  const hasActiveFilters = Boolean(
    city ||
      category ||
      when !== 'all' ||
      minPrice != null ||
      maxPrice != null ||
      (venueType && venueType !== 'all') ||
      lat != null
  )

  return (
    <div className="mb-8 space-y-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={EVENTS_COPY.SEARCH_PLACEHOLDER}
            aria-label={EVENTS_COPY.SEARCH_PLACEHOLDER}
            className={`h-14 rounded-full border-border bg-card pl-11 pr-28 text-base shadow-sm ${FIELD_CLASS}`}
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full px-5"
          >
            Search
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {EVENTS_COPY.WHEN_LABEL}
          </p>
          <div className="flex flex-wrap gap-2">
            {WHEN_OPTIONS.map((option) => {
              const active = when === option.value
              return (
                <Link
                  key={option.value}
                  href={buildEventsHref(currentParams({ when: option.value }))}
                  className={
                    active
                      ? 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
                      : 'rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40'
                  }
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {HOME_COPY.CITY_LABEL}
            </span>
            <select
              value={cityValue}
              onChange={(e) => onCityChange(e.target.value)}
              className="beats-filter-select h-11 rounded-full border border-border bg-card px-4 text-foreground"
            >
              <option value="">{HOME_COPY.CITY_ANY}</option>
              {DISCOVERY_CITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {EVENTS_COPY.MAX_PRICE}
            </span>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                placeholder={EVENTS_COPY.PRICE_MIN}
                className={FIELD_CLASS}
              />
              <Input
                inputMode="numeric"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                placeholder={EVENTS_COPY.PRICE_MAX}
                className={FIELD_CLASS}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {EVENTS_COPY.VENUE_TYPE_LABEL}
            </span>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as VenueTypeFilter)}
              className="beats-filter-select h-11 rounded-full border border-border bg-card px-4 text-foreground"
            >
              {VENUE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="h-11 w-full rounded-full">
              {EVENTS_COPY.APPLY_FILTERS}
            </Button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {typeof resultCount === 'number' ? (
          <p className="text-sm text-muted-foreground">
            {resultCount} {EVENTS_COPY.RESULTS_FOUND}
          </p>
        ) : (
          <span />
        )}
        {hasActiveFilters ? (
          <Link href="/events" className="text-sm font-semibold text-primary hover:underline">
            {EVENTS_COPY.CLEAR_FILTERS}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
