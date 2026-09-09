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
}

const WHEN_OPTIONS: Array<{ value: EventsWhenFilter; label: string }> = [
  { value: 'all', label: EVENTS_COPY.FILTER_ALL },
  { value: 'tonight', label: EVENTS_COPY.FILTER_TONIGHT },
  { value: 'this-week', label: EVENTS_COPY.FILTER_THIS_WEEK },
  { value: 'this-weekend', label: EVENTS_COPY.FILTER_THIS_WEEKEND },
]

const VENUE_OPTIONS: Array<{ value: VenueTypeFilter; label: string }> = [
  { value: 'all', label: EVENTS_COPY.VENUE_ANY },
  { value: 'OFFLINE', label: EVENTS_COPY.VENUE_OFFLINE },
  { value: 'ONLINE', label: EVENTS_COPY.VENUE_ONLINE },
  { value: 'HYBRID', label: EVENTS_COPY.VENUE_HYBRID },
]

const FILTER_FIELD_CLASS =
  'h-10 border-white/15 bg-[hsl(240_12%_12%)] text-white placeholder:text-white/45'

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
      // Radius stays internal when geo exists — not shown in the UI.
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
    <div className="mb-8 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[hsl(240_12%_9%/0.55)] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={EVENTS_COPY.SEARCH_PLACEHOLDER}
              aria-label={EVENTS_COPY.SEARCH_PLACEHOLDER}
              className={`h-11 ${FILTER_FIELD_CLASS}`}
            />
            <Button type="submit" className="h-11 shrink-0 px-6">
              Search
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{HOME_COPY.CITY_LABEL}</span>
              <select
                value={cityValue}
                onChange={(e) => onCityChange(e.target.value)}
                className="beats-filter-select h-10 rounded-md border border-white/15 bg-[hsl(240_12%_12%)] px-3 text-white"
              >
                <option value="">{HOME_COPY.CITY_ANY}</option>
                {DISCOVERY_CITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{EVENTS_COPY.PRICE_LABEL}</span>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder={EVENTS_COPY.PRICE_MIN}
                  className={FILTER_FIELD_CLASS}
                />
                <Input
                  inputMode="numeric"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder={EVENTS_COPY.PRICE_MAX}
                  className={FILTER_FIELD_CLASS}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{EVENTS_COPY.VENUE_TYPE_LABEL}</span>
              <select
                value={venue}
                onChange={(e) => setVenue(e.target.value as VenueTypeFilter)}
                className="beats-filter-select h-10 rounded-md border border-white/15 bg-[hsl(240_12%_12%)] px-3 text-white"
              >
                {VENUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button type="submit" variant="secondary" className="h-10 w-full">
                {EVENTS_COPY.APPLY_FILTERS}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {WHEN_OPTIONS.map((option) => {
            const active = when === option.value
            return (
              <Link
                key={option.value}
                href={buildEventsHref(currentParams({ when: option.value }))}
                className={
                  active
                    ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                    : 'rounded-md border border-white/15 bg-[hsl(240_12%_12%)] px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-primary/40 hover:text-white'
                }
              >
                {option.label}
              </Link>
            )
          })}
        </div>
      </div>

      {hasActiveFilters ? (
        <p className="text-sm text-muted-foreground">
          {city ? (
            <span>
              City: <span className="text-foreground">{city}</span>
            </span>
          ) : null}
          {city && category ? ' · ' : null}
          {category ? (
            <span>
              Category: <span className="text-foreground">{category}</span>
            </span>
          ) : null}
          {' · '}
          <Link href="/events" className="text-primary hover:underline">
            {EVENTS_COPY.CLEAR_FILTERS}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
