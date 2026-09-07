import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  fetchEvents,
  fetchPublicEventById,
  SignedMediaImage,
} from '@beat/api-client'
import { formatEventDateTime } from '@beat/utils'

import { EventCard } from '@/components'
import {
  EVENT_DETAIL_COPY,
  PAGE_METADATA,
  USER_ROUTES,
} from '@/constants'
import { createPageMetadata, formatTicketPrice } from '@/lib'

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
  } catch {
    notFound()
  }

  if (!event?.id) {
    notFound()
  }

  const sessions = event.sessions ?? []
  const primarySession = sessions[0]
  const locationLabel =
    [event.venue, event.city].filter(Boolean).join(' · ') ||
    EVENT_DETAIL_COPY.VENUE_TBA
  // Checkout/payment is intentionally not on this branch — CTA scrolls to sessions.
  const ticketsHref = '#sessions'
  const priceLabel =
    typeof event.priceFrom === 'number'
      ? `${EVENT_DETAIL_COPY.TICKETS_FROM} ${formatTicketPrice(event.priceFrom)}`
      : EVENT_DETAIL_COPY.GET_TICKETS

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

  return (
    <div className="pb-24">
      <div className="relative border-b border-border">
        <div className="aspect-[21/9] w-full overflow-hidden bg-muted sm:aspect-[3/1]">
          {event.coverImageUrl ? (
            <SignedMediaImage
              src={event.coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/35 via-background to-accent/25" />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href={USER_ROUTES.EVENTS}
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← {EVENT_DETAIL_COPY.BACK_TO_EVENTS}
        </Link>

        <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {event.title}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {event.startAt
                ? formatEventDateTime(event.startAt)
                : EVENT_DETAIL_COPY.DATE_TBA}
            </p>
            <p className="mt-1 text-muted-foreground">{locationLabel}</p>

            {event.description ? (
              <section className="mt-10">
                <h2 className="text-lg font-semibold text-foreground">
                  {EVENT_DETAIL_COPY.ABOUT}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
                  {event.description}
                </p>
              </section>
            ) : null}

            {sessions.length > 0 ? (
              <section className="mt-10" id="sessions">
                <h2 className="text-lg font-semibold text-foreground">
                  {EVENT_DETAIL_COPY.SESSIONS}
                </h2>
                <ul className="mt-4 space-y-3">
                  {sessions.map((session) => {
                    const sessionVenue =
                      session.eventAddress?.venueName ||
                      session.eventAddress?.city ||
                      event.venue ||
                      event.city
                    return (
                      <li
                        key={session.id}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <p className="font-medium text-foreground">
                          {session.title || event.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatEventDateTime(session.startAt)}
                          {sessionVenue ? ` · ${sessionVenue}` : ''}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

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

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-5">
              {primarySession ? (
                <p className="text-sm text-muted-foreground">
                  {formatEventDateTime(primarySession.startAt)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">{locationLabel}</p>
              <Link
                href={ticketsHref}
                className="mt-5 flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {priceLabel}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur lg:hidden">
        <Link
          href={ticketsHref}
          className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          {priceLabel}
        </Link>
      </div>
    </div>
  )
}
