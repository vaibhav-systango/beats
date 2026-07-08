import type { Event } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'
import { Link } from 'react-router-dom'

import { ORGANISER_EVENTS_COPY } from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'

export interface EventTableProps {
  events: Event[]
}

export function EventTable({ events }: EventTableProps) {
  if (events.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        {ORGANISER_EVENTS_COPY.EMPTY}
      </p>
    )
  }

  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/20">
          <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">
            {ORGANISER_EVENTS_COPY.TABLE_EVENT_COLUMN}
          </th>
          <th className="w-36 px-4 py-3 text-right font-medium text-muted-foreground sm:w-44 sm:px-6">
            {ORGANISER_EVENTS_COPY.TABLE_DATE_COLUMN}
          </th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id} className="border-b border-border last:border-b-0">
            <td className="px-4 py-3 sm:px-6">
              <Link
                to={ORGANISER_PATHS.eventDetail(event.id)}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {event.title}
              </Link>
            </td>
            <td className="px-4 py-3 text-right text-muted-foreground sm:px-6">
              {event.startAt ? formatEventDateTime(event.startAt) : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
