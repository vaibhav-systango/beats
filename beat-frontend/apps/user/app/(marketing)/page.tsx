import Link from 'next/link'
import { fetchEventCategories, fetchEvents, fetchEventsFeed } from '@beat/api-client'
import type { Event } from '@beat/types'

import { EventCard, HomeFeedControls } from '@/components'
import {
  BRAND_CONSTANTS,
  FALLBACK_CATEGORIES,
  HOME_COPY,
  PAGE_METADATA,
  USER_ROUTES,
} from '@/constants'
import {
  buildEventsHref,
  buildHomeHref,
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

const MARQUEE_CATEGORIES = [
  'Indie',
  'Stand-up',
  'Qawwali',
  'Hip-Hop',
  'Jazz',
  'EDM',
  'Bollywood',
  'Rock',
  'Rooftop',
  'Underground',
  'Techno',
] as const

function CategoryMarquee() {
  // Enough items to always fill wide screens; two identical halves for a seamless loop.
  const sequence = Array.from({ length: 4 }, () => [...MARQUEE_CATEGORIES]).flat()
  const halves = [sequence, sequence] as const

  return (
    <div className="border-y border-border/70 bg-card/50 py-3 backdrop-blur">
      <div className="overflow-hidden">
        <div className="beats-marquee-track flex w-max items-center">
          {halves.map((half, halfIndex) => (
            <div
              key={halfIndex}
              className="flex shrink-0 items-center gap-4 px-4"
              aria-hidden={halfIndex > 0 ? true : undefined}
            >
              {half.map((item, index) => (
                <span
                  key={`${halfIndex}-${item}-${index}`}
                  className="inline-flex items-center gap-4"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                    {item}
                  </span>
                  <span className="text-primary" aria-hidden>
                    ◆
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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
  subheading,
  events,
  emptyMessage,
  viewAllHref = USER_ROUTES.EVENTS,
  poster,
}: {
  heading: string
  subheading?: string
  events: Event[]
  emptyMessage: string
  viewAllHref?: string
  poster?: boolean
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          {HOME_COPY.VIEW_ALL_EVENTS} →
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              trending={index < 2}
              variant={poster ? 'poster' : 'grid'}
            />
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
  if (useBucketFeed) {
    try {
      const feed = await fetchEventsFeed({
        limit: 8,
        ...discoveryParams,
      })
      feedSections = feed.sections.filter((section) => section.data.length > 0)
    } catch {
      // Keep empty sections; popular fallback still loads below.
    }
  }

  try {
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

  const vibeCategories =
    categories.length > 0
      ? categories
      : FALLBACK_CATEGORIES.map((name) => ({ name }))

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-8 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
          <div>
            <span className="beats-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              {BRAND_CONSTANTS.LIVE_BADGE}
            </span>
            <h1 className="beats-fade-up beats-fade-up-delay-1 mt-5 max-w-xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
              {BRAND_CONSTANTS.TAGLINE_LINE_1}{' '}
              <span className="beats-text-gradient underline decoration-primary/40 decoration-2 underline-offset-4">
                {BRAND_CONSTANTS.TAGLINE_LINE_2}
              </span>
              {BRAND_CONSTANTS.TAGLINE_LINE_3}
            </h1>
            <p className="beats-fade-up beats-fade-up-delay-2 mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              {BRAND_CONSTANTS.HERO_DESCRIPTION}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={USER_ROUTES.EVENTS}
                className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-12px_hsl(var(--primary)/0.9)] transition hover:brightness-110"
              >
                {BRAND_CONSTANTS.EXPLORE_CTA} →
              </Link>
              <Link
                href={USER_ROUTES.WALLET}
                className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40"
              >
                {BRAND_CONSTANTS.CREDITS_CTA}
              </Link>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-[#22d3ee] sm:text-3xl">2.4k</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {HOME_COPY.STAT_SHOWS}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#ff2db8] sm:text-3xl">180+</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {HOME_COPY.STAT_VENUES}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#a855f7] sm:text-3xl">12</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {HOME_COPY.STAT_CITIES}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[400px] w-full max-w-md lg:block">
            <div
              aria-hidden
              className="beats-pulse-ring absolute inset-[4%] rounded-[2rem] border border-primary/30"
            />
            <div
              aria-hidden
              className="absolute inset-[10%] rounded-[2rem] bg-gradient-to-br from-primary/35 via-violet-500/25 to-cyan-400/30 blur-2xl"
            />

            {/* Live event photo frame */}
            <div className="absolute inset-y-[6%] right-0 w-[88%] overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.75)]">
              <img
                src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="beats-ken-burns h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Tonight in Mumbai
                </p>
                <p className="text-lg font-bold text-white">The city comes alive</p>
              </div>

              {/* Sparkles */}
              <span
                aria-hidden
                className="beats-sparkle absolute left-[18%] top-[22%] h-2 w-2 rounded-full bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.8)]"
              />
              <span
                aria-hidden
                className="beats-sparkle absolute right-[24%] top-[34%] h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_2px_rgba(103,232,249,0.9)]"
                style={{ animationDelay: '0.6s' }}
              />
              <span
                aria-hidden
                className="beats-sparkle absolute left-[40%] top-[48%] h-1.5 w-1.5 rounded-full bg-pink-300 shadow-[0_0_10px_2px_rgba(249,168,212,0.9)]"
                style={{ animationDelay: '1.1s' }}
              />
            </div>

            {/* Floating glass ticket */}
            <div className="beats-float-tilt absolute left-0 top-[16%] w-[58%] rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=200&q=60"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">Indie Night</p>
                  <p className="text-[10px] text-white/70">Sat · 8:00 pm</p>
                </div>
              </div>
            </div>

            <div className="beats-float-y absolute bottom-[8%] left-[4%] rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
              ✦ 2.4k shows live
            </div>

            <div className="beats-float-y absolute right-[4%] top-[10%] rounded-full bg-success px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-success-foreground shadow-lg">
              🔥 Trending
            </div>
          </div>
        </div>

        <CategoryMarquee />
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-8">
        <div className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
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
      </section>

      {!hasActiveFilters ? (
        <EventsRail
          heading={HOME_COPY.POPULAR_HEADING}
          subheading={HOME_COPY.POPULAR_SUBHEADING}
          events={popular.data.slice(0, 4)}
          emptyMessage={HOME_COPY.POPULAR_EMPTY}
          viewAllHref={resultsViewAll}
          poster
        />
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {HOME_COPY.CATEGORIES_HEADING}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {HOME_COPY.CATEGORIES_SUBHEADING}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={USER_ROUTES.HOME}
            className={
              !category
                ? 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
                : 'rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40'
            }
          >
            All
          </Link>
          {vibeCategories.map((item) => {
            const active = category === item.name
            return (
              <Link
                key={item.name}
                href={buildHomeHref({
                  city,
                  category: item.name,
                  when: when === 'all' ? undefined : when,
                  lat,
                  lng,
                  distanceKm: hasGeo ? distanceKm : undefined,
                })}
                className={
                  active
                    ? 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
                    : 'rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40'
                }
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </section>

      {feedSections.length > 0 && !hasActiveFilters ? (
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
      )}
    </div>
  )
}
