import { fetchEvents, PAGINATION_CONSTANTS } from '@beat/api-client'

import { EventCard } from '@/components'
import { createPageMetadata } from '@/lib'
import { NAV_LABELS, PAGE_METADATA, EVENT_STATUS } from '@/constants'

export const metadata = createPageMetadata(
  PAGE_METADATA.EVENTS.title,
  PAGE_METADATA.EVENTS.description
)

export default async function EventsPage() {
  let events = { data: [] as Awaited<ReturnType<typeof fetchEvents>>['data'] }
  try {
    events = await fetchEvents({
      page: PAGINATION_CONSTANTS.DEFAULT_PAGE,
      limit: PAGINATION_CONSTANTS.EVENTS_LIST_LIMIT,
      status: EVENT_STATUS.PUBLISHED,
    })
  } catch {
    // API not available
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">{NAV_LABELS.EVENTS}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.data.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
