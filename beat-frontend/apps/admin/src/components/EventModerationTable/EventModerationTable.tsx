import type { AdminPendingEvent } from '@beat/types'
import { Button } from '@beat/ui'
import { formatEventDateTime } from '@beat/utils'
import { Link } from 'react-router-dom'

import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'
import { ADMIN_PATHS } from '@/constants/routes.constants'

export interface EventModerationTableProps {
  events: AdminPendingEvent[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onView?: (id: string) => void
  isActionLoading?: boolean
  loadingEventId?: string | null
  showActions?: boolean
  emptyMessage?: string
}

export function EventModerationTable({
  events,
  onApprove,
  onReject,
  onView,
  isActionLoading = false,
  loadingEventId = null,
  showActions = true,
  emptyMessage = ADMIN_EVENTS_COPY.TABLE_EMPTY,
}: EventModerationTableProps) {
  if (events.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full table-fixed text-left text-sm ${showActions ? 'min-w-[48rem]' : 'min-w-[36rem]'}`}
      >
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th
              className={`px-4 py-3 font-medium text-muted-foreground sm:px-6 ${showActions ? 'w-[28%]' : 'w-[34%]'}`}
            >
              {ADMIN_EVENTS_COPY.TABLE_ORGANISER_COLUMN}
            </th>
            <th
              className={`px-4 py-3 font-medium text-muted-foreground sm:px-6 ${showActions ? 'w-[32%]' : 'w-[40%]'}`}
            >
              {ADMIN_EVENTS_COPY.TABLE_EVENT_COLUMN}
            </th>
            <th
              className={`px-4 py-3 font-medium text-muted-foreground sm:px-6 ${showActions ? 'w-[20%]' : 'w-[26%]'}`}
            >
              {ADMIN_EVENTS_COPY.TABLE_DATE_COLUMN}
            </th>
            {showActions ? (
              <th className="w-[20%] px-4 py-3 text-right font-medium text-muted-foreground sm:px-6">
                {ADMIN_EVENTS_COPY.TABLE_ACTIONS_COLUMN}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isRowLoading = showActions && isActionLoading && loadingEventId === event.id

            return (
              <tr key={event.id} className="border-b border-border last:border-b-0">
                <td className="truncate px-4 py-3 text-muted-foreground sm:px-6">
                  {event.organiserName}
                </td>
                <td className="px-4 py-3 sm:px-6">
                  <Link
                    to={ADMIN_PATHS.eventDetail(event.id)}
                    onClick={() => onView?.(event.id)}
                    className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground sm:px-6">
                  {event.startAt ? formatEventDateTime(event.startAt) : '—'}
                </td>
                {showActions ? (
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isRowLoading}
                        onClick={() => onApprove(event.id)}
                      >
                        {ADMIN_EVENTS_COPY.APPROVE_ACTION}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isRowLoading}
                        onClick={() => onReject(event.id)}
                      >
                        {ADMIN_EVENTS_COPY.REJECT_ACTION}
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
