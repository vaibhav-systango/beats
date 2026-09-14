'use client'

import Link from 'next/link'
import { SignedMediaImage } from '@beat/api-client'
import type { Event } from '@beat/types'

import { USER_ROUTES } from '@/constants'
import { formatTicketPrice, resolveEventCoverUrl } from '@/lib'

export interface EventCardProps {
  event: Event
  trending?: boolean
  variant?: 'grid' | 'poster'
}

function eventDateParts(startAt?: number) {
  if (!startAt) return null
  const date = new Date(startAt)
  if (Number.isNaN(date.getTime())) return null
  return {
    month: date.toLocaleString('en-IN', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()),
    weekday: date.toLocaleString('en-IN', { weekday: 'short' }),
    time: date.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  }
}

export function EventCard({
  event,
  trending = false,
  variant = 'grid',
}: EventCardProps) {
  const location = [event.venue, event.city].filter(Boolean).join(', ')
  const href = USER_ROUTES.EVENT_DETAIL(event.id)
  const coverUrl = resolveEventCoverUrl({
    coverImageUrl: event.coverImageUrl,
    title: event.title,
    city: event.city,
    id: event.id,
  })
  const parts = eventDateParts(event.startAt)

  if (variant === 'poster') {
    return (
      <Link
        href={href}
        className="group relative block aspect-[3/4] overflow-hidden rounded-3xl shadow-lg"
      >
        <SignedMediaImage
          src={coverUrl}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {parts ? (
          <span className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white text-center shadow-md">
            <span className="text-[10px] font-bold uppercase leading-none text-emerald-600">
              {parts.month}
            </span>
            <span className="text-lg font-black leading-none text-black">
              {parts.day}
            </span>
          </span>
        ) : null}
        {trending ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success-foreground">
            🔥 Trending
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-bold text-white">
            {event.title}
          </h3>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_50px_-20px_hsl(var(--primary)/0.35)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <SignedMediaImage
          src={coverUrl}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {parts ? (
          <span className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white text-center shadow-md">
            <span className="text-[10px] font-bold uppercase leading-none text-emerald-600">
              {parts.month}
            </span>
            <span className="text-lg font-black leading-none text-black">
              {parts.day}
            </span>
          </span>
        ) : null}
        {trending ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success-foreground">
            🔥 Trending
          </span>
        ) : null}
      </div>
      <article className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {event.title}
        </h3>
        {location ? (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="line-clamp-1">{location}</span>
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Starting from
            </p>
            <p className="text-base font-bold text-foreground">
              {typeof event.priceFrom === 'number'
                ? formatTicketPrice(event.priceFrom)
                : '—'}
            </p>
          </div>
          {parts ? (
            <p className="text-sm font-semibold text-primary">
              {parts.weekday} · {parts.time}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  )
}
