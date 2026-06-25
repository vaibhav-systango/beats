import type { Event } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

export interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold">{event.title}</h3>
      <p className="text-sm text-gray-500">{formatEventDateTime(event.startAt)}</p>
    </article>
  )
}
