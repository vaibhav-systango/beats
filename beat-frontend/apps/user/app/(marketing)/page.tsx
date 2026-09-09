import Link from 'next/link'
import { fetchEventCategories, fetchEvents, fetchEventsFeed } from '@beat/api-client'
import type { Event } from '@beat/types'

import { EventCard, HomeFeedControls, HomeSearch } from '@/components'
import {
  BRAND_CONSTANTS,
  FALLBACK_CATEGORIES,
  HOME_COPY,
  PAGE_METADATA,
  USER_ROUTES,
} from '@/constants'
import {
  buildEventsHref,
  createPageMetadata,
  getWhenDateRange,
  parseWhenFilter,
  radiusParam,
} from '@/lib'

export const metadata = createPageMetadata(
  PAGE_METADATA.HOME.title,
  PAGE_METADATA.HOME.description
)

type HomePageProps = {
  searchParams?: {
    city?: string | string[]
    category?: string | string[]
    when?: string | string[]
    lat?: string | string[]
    lng?: string | string[]
    distanceKm?: string | string[]
  }
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  const normalized = Array.isArray(value) ? value[0] : value
  return normalized?.trim() || undefined
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function EventsRail({
  heading,
  events,
  emptyMessage,
  viewAllHref = USER_ROUTES.EVENTS,
}: {
  heading: string
  events: Event[]
  emptyMessage: string
  viewAllHref?: string
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-primary hover:underline"
        >
          {HOME_COPY.VIEW_ALL_EVENTS}
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const city = getSearchParam(searchParams?.city)
  const category = getSearchParam(searchParams?.category)
  const when = parseWhenFilter(getSearchParam(searchParams?.when))
  const lat = parseNumber(getSearchParam(searchParams?.lat))
  const lng = parseNumber(getSearchParam(searchParams?.lng))
  const distanceKm = parseNumber(getSearchParam(searchParams?.distanceKm)) ?? 25
  const dateRange = getWhenDateRange(when)
  const hasGeo = lat != null && lng != null
  const hasActiveFilters = Boolean(city || category || hasGeo || when !== 'all')
  const discoveryParams = {
    ...(city ? { city } : {}),
    ...(category ? { category } : {}),
    ...(hasGeo ? { lat, lng, radius: radiusParam(distanceKm) } : {}),
    ...dateRange,
  }

  let categories: Array<{ id?: string; name: string }> = FALLBACK_CATEGORIES.map(
    (name) => ({ name })
  )
  let feedSections: Awaited<ReturnType<typeof fetchEventsFeed>>['sections'] = []
  let popular = { data: [] as Awaited<ReturnType<typeof fetchEvents>>['data'] }

  try {
    const fetched = await fetchEventCategories()
    if (fetched.length > 0) {
      categories = fetched.map((item) => ({
        id: item.id,
        name: item.name,
      }))
    }
  } catch {
    // keep fallback options
  }

  const useBucketFeed = !hasActiveFilters
  try {
    if (useBucketFeed) {
      const feed = await fetchEventsFeed({
        limit: 8,
        ...discoveryParams,
      })
      feedSections = feed.sections.filter((section) => section.data.length > 0)
    }
    popular = await fetchEvents({
      limit: 8,
      ...discoveryParams,
    })
  } catch {
    // API not available
  }

  const resultsHeading = city
    ? `${HOME_COPY.RESULTS_FOR} ${city}`
    : category
      ? `${category} events`
      : hasGeo || when !== 'all'
        ? HOME_COPY.FEED_HEADING
        : HOME_COPY.POPULAR_HEADING

  const resultsViewAll = buildEventsHref({
    city,
    category,
    when: when === 'all' ? undefined : when,
    lat,
    lng,
    distanceKm: hasGeo ? distanceKm : undefined,
  })

  const resultsBlock =
    feedSections.length > 0 && !hasActiveFilters ? (
      feedSections.map((section) => (
        <EventsRail
          key={section.key}
          heading={section.label}
          events={section.data}
          emptyMessage={HOME_COPY.POPULAR_EMPTY}
          viewAllHref={resultsViewAll}
        />
      ))
    ) : (
      <EventsRail
        heading={resultsHeading}
        events={popular.data}
        emptyMessage={
          hasActiveFilters ? HOME_COPY.FEED_EMPTY : HOME_COPY.POPULAR_EMPTY
        }
        viewAllHref={resultsViewAll}
      />
    )

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_hsl(262_70%_45%_/_0.28),_transparent_60%),linear-gradient(to_bottom,_transparent_55%,_hsl(240_14%_5%_/_0.55)_100%)]"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            {BRAND_CONSTANTS.NAME_UPPERCASE}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {BRAND_CONSTANTS.TAGLINE_LINE_1}
            <br />
            <span className="text-primary">{BRAND_CONSTANTS.TAGLINE_LINE_2}</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {BRAND_CONSTANTS.HERO_DESCRIPTION}
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-[hsl(240_12%_9%/0.55)] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-5">
            <HomeSearch />
            <HomeFeedControls
              city={city}
              category={category}
              when={when}
              lat={lat}
              lng={lng}
              distanceKm={distanceKm}
              categories={categories}
            />
          </div>
        </div>
      </section>

      {resultsBlock}
    </div>
  )
}
