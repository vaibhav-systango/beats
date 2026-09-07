'use client'

import Link from 'next/link'
import { SignedMediaImage } from '@beat/api-client'
import type { Event } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

import { USER_ROUTES } from '@/constants'
import { formatTicketPrice } from '@/lib'

export interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const location = [event.venue, event.city].filter(Boolean).join(' · ')
  const href = USER_ROUTES.EVENT_DETAIL(event.id)

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        {event.coverImageUrl ? (
          <SignedMediaImage
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-accent/20">
            <span className="text-sm font-medium text-muted-foreground">Beats</span>
          </div>
        )}
      </div>
      <article className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {event.startAt ? formatEventDateTime(event.startAt) : 'Date TBA'}
        </p>
        {location ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">{location}</p>
        ) : null}
        {typeof event.priceFrom === 'number' ? (
          <p className="mt-auto pt-2 text-sm font-medium text-accent">
            From {formatTicketPrice(event.priceFrom)}
          </p>
        ) : null}
      </article>
    </Link>
  )
}
