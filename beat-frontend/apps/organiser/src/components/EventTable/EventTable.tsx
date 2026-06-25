import type { Event } from '@beat/types'
import { formatEventDateTime } from '@beat/utils'

export interface EventTableProps {
  events: Event[]
}

export function EventTable({ events }: EventTableProps) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">No events yet.</p>
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b text-gray-500">
          <th className="py-2">Event</th>
          <th className="py-2">Date</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id} className="border-b">
            <td className="py-2">{event.title}</td>
            <td className="py-2">{formatEventDateTime(event.startAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
