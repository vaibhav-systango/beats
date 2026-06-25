import { fetchEvents } from '@beat/api-client'

import { EventCard } from '@/components'
import { createPageMetadata } from '@/lib'

export const metadata = createPageMetadata('Events', 'Browse events on Beat')

export default async function EventsPage() {
  let events = { data: [] as Awaited<ReturnType<typeof fetchEvents>>['data'] }
  try {
    events = await fetchEvents({ page: 1, limit: 24, status: 'PUBLISHED' })
  } catch {
    // API not available
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">Events</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.data.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
