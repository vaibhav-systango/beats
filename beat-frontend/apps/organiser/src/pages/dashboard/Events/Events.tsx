import { EventTable } from '@/components'
import { ORGANISER_EVENTS_COPY } from '@/constants'
import { useEvents } from '@/hooks'

export function Events() {
  const { data, isLoading } = useEvents()

  if (isLoading) {
    return <p className="text-gray-500">{ORGANISER_EVENTS_COPY.LOADING}</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{ORGANISER_EVENTS_COPY.TITLE}</h1>
      <EventTable events={data?.data ?? []} />
    </div>
  )
}
