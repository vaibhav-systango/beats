import { useUpdateEventSession } from '@beat/api-client'
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
    const patch: UpdateSessionInput = {}

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

    if (!session?.id) {
      setError('No session found for this event.')
      return
    }

    const sessionPatch = buildSessionPatch()

    try {
      if (hasSessionPatchPayload(sessionPatch)) {
        const formData = buildSessionPatchFormData(sessionPatch)
        await updateSession.mutateAsync({
          eventId,
          sessionId: session.id,
          formData,
        })
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
      error={error}
      isSaving={updateSession.isPending}
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
      onBack={onBack}
      onSaveAndNext={() => void handleSaveAndNext()}
    />
  )
}
