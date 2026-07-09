import type { EventSession } from '@beat/types'

type SessionMutations = {
  create: (args: { eventId: string; formData: FormData }) => Promise<EventSession>
  update: (args: {
    eventId: string
    sessionId: string
    formData: FormData
  }) => Promise<EventSession>
}

export async function upsertSession(
  eventId: string,
  sessionId: string | undefined,
  formData: FormData,
  mutations: SessionMutations
): Promise<EventSession> {
  if (sessionId) {
    return mutations.update({ eventId, sessionId, formData })
  }
  return mutations.create({ eventId, formData })
}
