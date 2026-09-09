'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui'
import { DISCOVERY_CITIES, HOME_COPY } from '@/constants'
import {
  buildHomeHref,
  cityCoordinates,
  parseWhenFilter,
  readDiscoveryPrefs,
  writeDiscoveryPrefs,
  type EventsWhenFilter,
} from '@/lib'

type HomeFeedControlsProps = {
  city?: string
  category?: string
  when: EventsWhenFilter
  lat?: number
  lng?: number
  distanceKm?: number
  categories: Array<{ id?: string; name: string }>
}

const WHEN_OPTIONS: Array<{ value: EventsWhenFilter; label: string }> = [
  { value: 'all', label: HOME_COPY.FILTER_ALL },
  { value: 'tonight', label: HOME_COPY.FILTER_TONIGHT },
  { value: 'this-week', label: HOME_COPY.FILTER_THIS_WEEK },
  { value: 'this-weekend', label: HOME_COPY.FILTER_THIS_WEEKEND },
]

export function HomeFeedControls({
  city,
  category,
  when,
  lat,
  lng,
  distanceKm = 25,
  categories,
}: HomeFeedControlsProps) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const hasFilters = Boolean(
    city || category || when !== 'all' || (lat != null && lng != null)
  )

  // Browser refresh keeps query params; reset home to the unfiltered landing.
  useEffect(() => {
    const entry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming | undefined
    if (entry?.type === 'reload' && window.location.search) {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    writeDiscoveryPrefs({
      city,
      lat,
      lng,
      radiusKm: distanceKm,
    })
  }, [city, lat, lng, distanceKm])

  function navigate(next: {
    city?: string | null
    category?: string | null
    when?: EventsWhenFilter
    lat?: number | null
    lng?: number | null
    distanceKm?: number
  }) {
    const nextCity = next.city === null ? undefined : (next.city ?? city)
    const nextCategory =
      next.category === null ? undefined : (next.category ?? category)
    const nextWhen = next.when ?? when
    const nextLat = next.lat === null ? undefined : (next.lat ?? lat)
    const nextLng = next.lng === null ? undefined : (next.lng ?? lng)
    router.push(
      buildHomeHref({
        city: nextCity,
        category: nextCategory,
        when: nextWhen,
        lat: nextLat,
        lng: nextLng,
        distanceKm: next.distanceKm ?? distanceKm,
      })
    )
  }

  function clearFilters() {
    writeDiscoveryPrefs({})
    setStatus(null)
    router.push('/')
  }

  function onCityChange(nextCity: string) {
    if (!nextCity) {
      navigate({ city: null, lat: null, lng: null })
      return
    }
    const coords = cityCoordinates(nextCity)
    navigate({
      city: nextCity,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
  }

  function useSavedLocation() {
    const prefs = readDiscoveryPrefs()
    if (prefs.lat != null && prefs.lng != null) {
      setStatus(HOME_COPY.LOCATION_SAVED_APPLIED)
      navigate({
        city: prefs.city,
        lat: prefs.lat,
        lng: prefs.lng,
        distanceKm: prefs.radiusKm ?? distanceKm,
      })
      return
    }
    if (!navigator.geolocation) {
      setStatus(HOME_COPY.LOCATION_UNAVAILABLE)
      return
    }
    setStatus(HOME_COPY.LOCATION_DETECTING)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus(HOME_COPY.LOCATION_APPLIED)
        navigate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          distanceKm,
        })
      },
      () => setStatus(HOME_COPY.LOCATION_DENIED),
      { enableHighAccuracy: false, timeout: 10_000 }
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{HOME_COPY.CITY_LABEL}</span>
          <select
            value={city ?? ''}
            onChange={(event) => onCityChange(event.target.value)}
            className="beats-filter-select h-11 rounded-md border border-white/15 bg-[hsl(240_12%_12%)] px-3 text-white"
          >
            <option value="">{HOME_COPY.CITY_ANY}</option>
            {DISCOVERY_CITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{HOME_COPY.CATEGORY_LABEL}</span>
          <select
            value={category ?? ''}
            onChange={(event) =>
              navigate({
                category: event.target.value ? event.target.value : null,
              })
            }
            className="beats-filter-select h-11 rounded-md border border-white/15 bg-[hsl(240_12%_12%)] px-3 text-white"
          >
            <option value="">{HOME_COPY.CATEGORY_ANY}</option>
            {categories.map((item) => (
              <option key={item.id ?? item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{HOME_COPY.DATE_LABEL}</span>
          <select
            value={when}
            onChange={(event) =>
              navigate({ when: parseWhenFilter(event.target.value) })
            }
            className="beats-filter-select h-11 rounded-md border border-white/15 bg-[hsl(240_12%_12%)] px-3 text-white"
          >
            {WHEN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <Button type="button" variant="outline" className="h-11" onClick={useSavedLocation}>
          {HOME_COPY.USE_SAVED_LOCATION}
        </Button>

        {hasFilters ? (
          <Button type="button" variant="ghost" className="h-11" onClick={clearFilters}>
            {HOME_COPY.CLEAR_FILTERS}
          </Button>
        ) : null}
      </div>

      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
      {(lat != null && lng != null) || city || category ? (
        <p className="text-xs text-muted-foreground">
          {[
            city ? `${HOME_COPY.ACTIVE_CITY} ${city}` : null,
            !city && lat != null && lng != null ? HOME_COPY.ACTIVE_GEO : null,
            category ? `${HOME_COPY.CATEGORY_LABEL}: ${category}` : null,
            lat != null && lng != null ? `${distanceKm}km` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
    </div>
  )
}
