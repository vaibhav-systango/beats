import { EventTable } from '@/components'
import { useEvents } from '@/hooks'

export function Events() {
  const { data, isLoading } = useEvents()

  if (isLoading) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your Events</h1>
      <EventTable events={data?.data ?? []} />
    </div>
  )
}
