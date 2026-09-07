import Link from 'next/link'
import { fetchEventCategories, fetchEvents } from '@beat/api-client'

import { EventCard, HomeSearch } from '@/components'
import {
  BRAND_CONSTANTS,
  DISCOVERY_CITIES,
  FALLBACK_CATEGORIES,
  HOME_COPY,
  PAGE_METADATA,
  USER_ROUTES,
} from '@/constants'
import { buildEventsHref, createPageMetadata } from '@/lib'

export const metadata = createPageMetadata(
  PAGE_METADATA.HOME.title,
  PAGE_METADATA.HOME.description
)

export default async function HomePage() {
  let popular = { data: [] as Awaited<ReturnType<typeof fetchEvents>>['data'] }
  let categories: Array<{ id?: string; name: string }> = FALLBACK_CATEGORIES.map(
    (name) => ({ name })
  )

  try {
    popular = await fetchEvents({ limit: 8 })
  } catch {
    // API not available
  }

  try {
    const fetched = await fetchEventCategories()
    if (fetched.length > 0) {
      categories = fetched.map((category) => ({
        id: category.id,
        name: category.name,
      }))
    }
  } catch {
    // keep fallback tiles
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.18),_transparent_45%)]"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
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
          <HomeSearch />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-foreground">
          {HOME_COPY.CITIES_HEADING}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {DISCOVERY_CITIES.map((city) => (
            <Link
              key={city}
              href={buildEventsHref({ city })}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-xl font-semibold text-foreground">
            {HOME_COPY.CATEGORIES_HEADING}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id ?? category.name}
                href={buildEventsHref({ category: category.name })}
                className="rounded-lg border border-border bg-background px-4 py-5 transition-colors hover:border-accent/50 hover:bg-muted/40"
              >
                <span className="font-medium text-foreground">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            {HOME_COPY.POPULAR_HEADING}
          </h2>
          <Link
            href={USER_ROUTES.EVENTS}
            className="text-sm font-medium text-primary hover:underline"
          >
            {HOME_COPY.VIEW_ALL_EVENTS}
          </Link>
        </div>

        {popular.data.length === 0 ? (
          <p className="text-muted-foreground">{HOME_COPY.POPULAR_EMPTY}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
