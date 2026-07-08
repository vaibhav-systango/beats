import { useUpdateEventSession } from '@beat/api-client'
import type { EventSession, SessionTicketType, UpdateSessionInput } from '@beat/types'
import { useState } from 'react'

import { TicketsStepView } from './TicketsStepView'

import { EVENT_EDITOR_COPY } from '@/constants'
import {
  buildSessionFormData,
  buildSessionPatchFormData,
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
  hasSessionPatchPayload,
} from '@/lib/sessionFormData'
import { validateTicketSaleWindow } from '@/lib/validation'

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
  const [saleWindowError, setSaleWindowError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sessionStartLocal = epochToDatetimeLocal(session?.startAt)

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

  const validateSaleWindow = (): boolean => {
    const message = validateTicketSaleWindow(
      saleStartLocal,
      saleEndLocal,
      sessionStartLocal
    )
    setSaleWindowError(message)
    if (message) {
      setError(message)
      return false
    }
    return true
  }

  const buildDraftPatch = (): UpdateSessionInput => {
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

  const buildFullSessionInput = () => ({
    categoryIds: session!.categoryIds ?? [],
    startAt: session!.startAt,
    endAt: session!.endAt,
    location: session!.location,
    eventAddress: session!.eventAddress,
    capacity: session!.capacity,
    mode: session!.mode,
    ticketSaleStartAt: datetimeLocalToEpoch(saleStartLocal) || session!.ticketSaleStartAt,
    ticketSaleEndAt: datetimeLocalToEpoch(saleEndLocal) || session!.ticketSaleEndAt,
    ticketTypes,
  })

  const handleSaveDraft = async () => {
    setError(null)

    if (!session?.id) {
      setError('Complete Basic Info before setting up tickets.')
      return
    }

    if (!validateSaleWindow()) {
      return
    }

    const sessionPatch = buildDraftPatch()
    if (!hasSessionPatchPayload(sessionPatch)) {
      return
    }

    try {
      const formData = buildSessionPatchFormData(sessionPatch)

      await updateSession.mutateAsync({
        eventId,
        sessionId: session.id,
        formData,
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save tickets.')
    }
  }

  const handleSaveAndNext = async () => {
    setError(null)

    if (!session?.id) {
      setError('Complete Basic Info before setting up tickets.')
      return
    }

    if (ticketTypes.length === 0) {
      setError('Add at least one ticket type.')
      return
    }

    if (!validateSaleWindow()) {
      return
    }

    try {
      const formData = buildSessionFormData(buildFullSessionInput())

      await updateSession.mutateAsync({
        eventId,
        sessionId: session.id,
        formData,
      })

      onNext()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save tickets.')
    }
  }

  const handleSaleStartChange = (value: string) => {
    setSaleStartLocal(value)
    setSaleWindowError(null)
  }

  const handleSaleEndChange = (value: string) => {
    setSaleEndLocal(value)
    setSaleWindowError(null)
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
      saleWindowError={saleWindowError}
      error={error}
      isSaving={updateSession.isPending}
      backLabel={EVENT_EDITOR_COPY.BACK}
      saveLabel={EVENT_EDITOR_COPY.SAVE}
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
      onSaleStartChange={handleSaleStartChange}
      onSaleEndChange={handleSaleEndChange}
      onBack={onBack}
      onSaveDraft={() => void handleSaveDraft()}
      onSaveAndNext={() => void handleSaveAndNext()}
    />
  )
}
