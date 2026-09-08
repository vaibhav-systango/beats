import { TicketCheckout } from '@/components/TicketCheckout/TicketCheckout'
import { PAGE_METADATA } from '@/constants'
import { createPageMetadata } from '@/lib'

type EventTicketsPageProps = {
  params: { id: string }
}

export const metadata = createPageMetadata(
  PAGE_METADATA.EVENT_TICKETS.title,
  PAGE_METADATA.EVENT_TICKETS.description
)

export default function EventTicketsPage({ params }: EventTicketsPageProps) {
  return <TicketCheckout eventId={params.id} />
}
