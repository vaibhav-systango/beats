'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button, Input } from '@/components/ui'
import { EVENTS_COPY } from '@/constants'
import {
  buildEventsHref,
  type EventsWhenFilter,
} from '@/lib'

type EventsBrowseToolbarProps = {
  q?: string
  city?: string
  category?: string
  when: EventsWhenFilter
}

const WHEN_OPTIONS: Array<{ value: EventsWhenFilter; label: string }> = [
  { value: 'all', label: EVENTS_COPY.FILTER_ALL },
  { value: 'this-week', label: EVENTS_COPY.FILTER_THIS_WEEK },
  { value: 'this-weekend', label: EVENTS_COPY.FILTER_THIS_WEEKEND },
]

export function EventsBrowseToolbar({
  q = '',
  city,
  category,
  when,
}: EventsBrowseToolbarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(q)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(buildEventsHref({ q: query, city, category, when }))
  }

  return (
    <div className="mb-8 space-y-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={EVENTS_COPY.SEARCH_PLACEHOLDER}
          aria-label={EVENTS_COPY.SEARCH_PLACEHOLDER}
          className="h-11"
        />
        <Button type="submit" className="h-11 shrink-0 px-6">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {WHEN_OPTIONS.map((option) => {
          const active = when === option.value
          return (
            <Link
              key={option.value}
              href={buildEventsHref({
                q: query,
                city,
                category,
                when: option.value,
              })}
              className={
                active
                  ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                  : 'rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground'
              }
            >
              {option.label}
            </Link>
          )
        })}
      </div>

      {(city || category) && (
        <p className="text-sm text-muted-foreground">
          {city ? (
            <span>
              City: <span className="text-foreground">{city}</span>
            </span>
          ) : null}
          {city && category ? ' · ' : null}
          {category ? (
            <span>
              Category: <span className="text-foreground">{category}</span>
            </span>
          ) : null}
          {' · '}
          <Link href="/events" className="text-primary hover:underline">
            Clear filters
          </Link>
        </p>
      )}
    </div>
  )
}
