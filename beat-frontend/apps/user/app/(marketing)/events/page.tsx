import { fetchEvents, PAGINATION_CONSTANTS } from '@beat/api-client'

import { EventCard, EventsBrowseToolbar } from '@/components'
import { EVENTS_COPY, NAV_LABELS, PAGE_METADATA } from '@/constants'
import {
  createPageMetadata,
  filterEventsByWhen,
  getWhenDateRange,
  parseWhenFilter,
} from '@/lib'

export const metadata = createPageMetadata(
  PAGE_METADATA.EVENTS.title,
  PAGE_METADATA.EVENTS.description
)

type EventsPageProps = {
  searchParams?: {
    q?: string | string[]
    city?: string | string[]
    category?: string | string[]
    when?: string | string[]
  }
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  const normalized = Array.isArray(value) ? value[0] : value
  return normalized?.trim() || undefined
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const q = getSearchParam(searchParams?.q)
  const city = getSearchParam(searchParams?.city)
  const category = getSearchParam(searchParams?.category)
  const when = parseWhenFilter(getSearchParam(searchParams?.when))
  const dateRange = getWhenDateRange(when)

  let events = { data: [] as Awaited<ReturnType<typeof fetchEvents>>['data'] }
  try {
    events = await fetchEvents({
      page: PAGINATION_CONSTANTS.DEFAULT_PAGE,
      limit: PAGINATION_CONSTANTS.EVENTS_LIST_LIMIT,
      ...(q ? { search: q } : {}),
      ...(city ? { city } : {}),
      ...(category ? { category } : {}),
      ...dateRange,
    })
  } catch {
    // API not available
  }

  const filtered = filterEventsByWhen(events.data, when)

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold text-foreground">{NAV_LABELS.EVENTS}</h1>
      <p className="mb-8 text-muted-foreground">
        Search and filter live experiences near you.
      </p>

      <EventsBrowseToolbar q={q} city={city} category={category} when={when} />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-muted-foreground">
          {EVENTS_COPY.EMPTY}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
