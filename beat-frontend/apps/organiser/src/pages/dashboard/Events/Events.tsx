import { Button } from '@beat/ui'
import { Link } from 'react-router-dom'

import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageSection,
  EventTable,
} from '@/components'
import { ORGANISER_EVENTS_COPY } from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import { useEvents } from '@/hooks'

export function Events() {
  const { data, isLoading } = useEvents()

  if (isLoading) {
    return (
      <DashboardPage>
        <p className="text-sm text-muted-foreground">{ORGANISER_EVENTS_COPY.LOADING}</p>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={ORGANISER_EVENTS_COPY.TITLE}
        actions={
          <Link to={ORGANISER_PATHS.EVENT_CREATE}>
            <Button variant="primary" type="button">
              {ORGANISER_EVENTS_COPY.NEW_EVENT}
            </Button>
          </Link>
        }
      />

      <DashboardPageSection className="overflow-hidden">
        <EventTable events={data?.data ?? []} />
      </DashboardPageSection>
    </DashboardPage>
  )
}
