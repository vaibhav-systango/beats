import { TicketView } from '@/components/TicketView/TicketView'
import { PAGE_METADATA } from '@/constants'
import { createPageMetadata } from '@/lib'

type TicketPageProps = {
  params: { ticketId: string }
}

export const metadata = createPageMetadata(
  PAGE_METADATA.TICKET.title,
  PAGE_METADATA.TICKET.description
)

export default function TicketPage({ params }: TicketPageProps) {
  return <TicketView ticketId={params.ticketId} />
}
