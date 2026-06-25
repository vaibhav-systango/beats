import { ADMIN_MODERATION_COPY } from '@/constants'

export function EventModeration() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">{ADMIN_MODERATION_COPY.TITLE}</h1>
      <p className="text-gray-500">{ADMIN_MODERATION_COPY.DESCRIPTION}</p>
    </div>
  )
}
