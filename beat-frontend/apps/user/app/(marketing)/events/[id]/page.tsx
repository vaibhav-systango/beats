import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  fetchEvents,
  fetchPublicEventById,
  isNotFoundApiError,
  SignedMediaImage,
} from '@beat/api-client'
import { formatEventDateTime } from '@beat/utils'

import { EventCard, EventDetailTabs } from '@/components'
import {
  EVENT_DETAIL_COPY,
  PAGE_METADATA,
  USER_ROUTES,
} from '@/constants'
import { createPageMetadata, resolveEventCoverUrl } from '@/lib'

type EventDetailPageProps = {
  params: { id: string }
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  try {
    const event = await fetchPublicEventById(params.id)
    return createPageMetadata(
      event.title || PAGE_METADATA.EVENT_DETAIL.title,
      event.description?.slice(0, 140) || PAGE_METADATA.EVENT_DETAIL.description
    )
  } catch {
    return createPageMetadata(
      PAGE_METADATA.EVENT_DETAIL.title,
      PAGE_METADATA.EVENT_DETAIL.description
    )
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  let event: Awaited<ReturnType<typeof fetchPublicEventById>>

  try {
    event = await fetchPublicEventById(params.id)
  } catch (error) {
    if (isNotFoundApiError(error)) {
      notFound()
    }
    throw error
  }

  if (!event?.id) {
    notFound()
  }

  const locationLabel =
    [event.venue, event.city].filter(Boolean).join(' · ') ||
    EVENT_DETAIL_COPY.VENUE_TBA
  const ticketsHref = USER_ROUTES.EVENT_TICKETS(event.id)

  let related: Awaited<ReturnType<typeof fetchEvents>>['data'] = []
  if (event.city) {
    try {
      const relatedResponse = await fetchEvents({
        city: event.city,
        limit: 4,
      })
      related = relatedResponse.data.filter((item) => item.id !== event.id).slice(0, 3)
    } catch {
      related = []
    }
  }

  const coverUrl = resolveEventCoverUrl({
    coverImageUrl: event.coverImageUrl,
    title: event.title,
    city: event.city,
    id: event.id,
  })

  return (
    <div>
      <div className="relative border-b border-border">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted sm:aspect-[3/1]">
          <SignedMediaImage
            src={coverUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20"
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href={USER_ROUTES.EVENTS}
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← {EVENT_DETAIL_COPY.BACK_TO_EVENTS}
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {event.startAt
              ? formatEventDateTime(event.startAt)
              : EVENT_DETAIL_COPY.DATE_TBA}
          </p>
          <p className="mt-1 text-muted-foreground">{locationLabel}</p>

          <EventDetailTabs
            event={event}
            ticketsHref={ticketsHref}
            locationLabel={locationLabel}
          />

          {related.length > 0 && event.city ? (
            <section className="mt-12">
              <h2 className="text-lg font-semibold text-foreground">
                {EVENT_DETAIL_COPY.RELATED_HEADING} {event.city}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <EventCard key={item.id} event={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
