'use client'

import Link from 'next/link'
import { SignedMediaImage } from '@beat/api-client'
import type { Event } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

import { USER_ROUTES } from '@/constants'
import { formatTicketPrice, resolveEventCoverUrl } from '@/lib'

export interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const location = [event.venue, event.city].filter(Boolean).join(' · ')
  const href = USER_ROUTES.EVENT_DETAIL(event.id)
  const coverUrl = resolveEventCoverUrl({
    coverImageUrl: event.coverImageUrl,
    title: event.title,
    city: event.city,
    id: event.id,
  })

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[hsl(240_12%_10%/0.78)] shadow-[0_12px_40px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_18px_50px_-18px_hsla(262,72%,48%,0.35)]"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <SignedMediaImage
          src={coverUrl}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
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
