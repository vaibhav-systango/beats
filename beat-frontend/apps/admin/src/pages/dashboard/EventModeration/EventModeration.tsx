import { DashboardPage, DashboardPageHeader } from '@/components'
import { ADMIN_MODERATION_COPY } from '@/constants'

export function EventModeration() {
  return (
    <DashboardPage>
      <DashboardPageHeader title={ADMIN_MODERATION_COPY.TITLE} />
    </DashboardPage>
  )
}
