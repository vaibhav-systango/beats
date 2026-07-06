import { Button } from '@beat/ui'
import { Link } from 'react-router-dom'

import { EventTable } from '@/components'
import { ORGANISER_EVENTS_COPY } from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import { useEvents } from '@/hooks'

export function Events() {
  const { data, isLoading } = useEvents()

  if (isLoading) {
    return <p className="text-gray-500">{ORGANISER_EVENTS_COPY.LOADING}</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{ORGANISER_EVENTS_COPY.TITLE}</h1>
        <Link to={ORGANISER_PATHS.EVENT_CREATE}>
          <Button variant="primary" type="button">
            {ORGANISER_EVENTS_COPY.NEW_EVENT}
          </Button>
        </Link>
      </div>
      <EventTable events={data?.data ?? []} />
    </div>
  )
}
