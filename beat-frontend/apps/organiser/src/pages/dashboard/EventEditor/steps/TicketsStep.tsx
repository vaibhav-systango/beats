import { useCreateEventSession, useUpdateEventSession } from '@beat/api-client'
import type { EventSession, SessionTicketType, UpdateSessionInput } from '@beat/types'
import { useState } from 'react'

import { TicketsStepView } from './TicketsStepView'

import { EVENT_EDITOR_COPY } from '@/constants'
import {
  buildSessionPatchFormData,
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
  hasSessionPatchPayload,
} from '@/lib/sessionFormData'
import { upsertSession } from '@/lib/sessionUpsert'
import { useEventDetailContext } from '@/router/eventDetailContext'

export interface TicketsStepProps {
  eventId: string
  session?: EventSession
  onBack: () => void
  onNext: () => void
}

function createEmptyTicket(session?: EventSession): SessionTicketType {
  const now = Date.now()
  return {
    name: '',
    price: 0,
    quantity: 50,
    saleStartAt: session?.ticketSaleStartAt ?? now,
    saleEndAt: session?.ticketSaleEndAt ?? session?.startAt ?? now + 86_400_000,
  }
}

export function TicketsStep({ eventId, session, onBack, onNext }: TicketsStepProps) {
  const { onSessionCreated } = useEventDetailContext()
  const createSession = useCreateEventSession()
  const updateSession = useUpdateEventSession()

  const [ticketTypes, setTicketTypes] = useState<SessionTicketType[]>(
    session?.ticketTypes?.length ? session.ticketTypes : []
  )
  const [showForm, setShowForm] = useState(false)
  const [draftTicket, setDraftTicket] = useState<SessionTicketType>(() =>
    createEmptyTicket(session)
  )
  const [saleStartLocal, setSaleStartLocal] = useState(
    epochToDatetimeLocal(session?.ticketSaleStartAt)
  )
  const [saleEndLocal, setSaleEndLocal] = useState(
    epochToDatetimeLocal(session?.ticketSaleEndAt)
  )
  const [requireGuestName, setRequireGuestName] = useState(
    !!session?.requireGuestName
  )
  const [requireGuestAge, setRequireGuestAge] = useState(!!session?.requireGuestAge)
  const [error, setError] = useState<string | null>(null)

  const addTicket = () => {
    if (!draftTicket.name.trim()) {
      setError('Ticket name is required.')
      return
    }
    setTicketTypes((current) => [...current, { ...draftTicket, name: draftTicket.name.trim() }])
    setDraftTicket(createEmptyTicket(session))
    setShowForm(false)
    setError(null)
  }

  const removeTicket = (index: number) => {
    setTicketTypes((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const buildSessionPatch = (): UpdateSessionInput => {
    const patch: UpdateSessionInput = {
      requireGuestName,
      requireGuestAge,
    }

    if (saleStartLocal) {
      patch.ticketSaleStartAt = datetimeLocalToEpoch(saleStartLocal)
    }
    if (saleEndLocal) {
      patch.ticketSaleEndAt = datetimeLocalToEpoch(saleEndLocal)
    }
    if (ticketTypes.length > 0) {
      patch.ticketTypes = ticketTypes
    }

    return patch
  }

  const handleSaveAndNext = async () => {
    setError(null)

    const sessionPatch = buildSessionPatch()

    try {
      if (hasSessionPatchPayload(sessionPatch)) {
        const formData = buildSessionPatchFormData(sessionPatch)
        const saved = await upsertSession(eventId, session?.id, formData, {
          create: (args) => createSession.mutateAsync(args),
          update: (args) => updateSession.mutateAsync(args),
        })
        if (!session?.id) {
          onSessionCreated(saved.id)
        }
      }

      onNext()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save tickets.')
    }
  }

  return (
    <TicketsStepView
      title={EVENT_EDITOR_COPY.TICKETS_TITLE}
      description={EVENT_EDITOR_COPY.TICKETS_DESCRIPTION}
      setupTitle={EVENT_EDITOR_COPY.SETUP_TICKETING}
      setupDescription={EVENT_EDITOR_COPY.SETUP_TICKETING_DESCRIPTION}
      addTicketsLabel={EVENT_EDITOR_COPY.ADD_TICKETS}
      ticketTypes={ticketTypes}
      showForm={showForm}
      draftTicket={draftTicket}
      saleStartLocal={saleStartLocal}
      saleEndLocal={saleEndLocal}
      requireGuestName={requireGuestName}
      requireGuestAge={requireGuestAge}
      error={error}
      isSaving={createSession.isPending || updateSession.isPending}
      backLabel={EVENT_EDITOR_COPY.BACK}
      nextLabel={EVENT_EDITOR_COPY.NEXT}
      onShowForm={() => setShowForm(true)}
      onRemoveTicket={removeTicket}
      onDraftNameChange={(value) =>
        setDraftTicket((current) => ({ ...current, name: value }))
      }
      onDraftPriceChange={(value) =>
        setDraftTicket((current) => ({ ...current, price: value }))
      }
      onDraftQuantityChange={(value) =>
        setDraftTicket((current) => ({ ...current, quantity: value }))
      }
      onAddTicket={addTicket}
      onSaleStartChange={setSaleStartLocal}
      onSaleEndChange={setSaleEndLocal}
      onRequireGuestNameChange={setRequireGuestName}
      onRequireGuestAgeChange={setRequireGuestAge}
      onBack={onBack}
      onSaveAndNext={() => void handleSaveAndNext()}
    />
  )
}
