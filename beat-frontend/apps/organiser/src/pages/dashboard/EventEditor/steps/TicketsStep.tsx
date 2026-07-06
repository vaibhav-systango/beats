import { useUpdateEventSession } from '@beat/api-client'
import { Button, Input, Label, Loader2 } from '@beat/ui'
import type { EventSession, SessionTicketType } from '@beat/types'
import { useState } from 'react'

import { EVENT_EDITOR_COPY } from '@/constants'
import {
  buildSessionFormData,
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
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

  const handleSave = async (advance = false) => {
    setError(null)

    if (!session?.id) {
      setError('Complete Basic Info before setting up tickets.')
      return
    }

    if (ticketTypes.length === 0) {
      setError('Add at least one ticket type.')
      return
    }

    try {
      const formData = buildSessionFormData({
        categoryIds: session.categoryIds ?? [],
        startAt: session.startAt,
        endAt: session.endAt,
        location: session.location,
        eventAddress: session.eventAddress,
        capacity: session.capacity,
        mode: session.mode,
        ticketSaleStartAt: datetimeLocalToEpoch(saleStartLocal) || session.ticketSaleStartAt,
        ticketSaleEndAt: datetimeLocalToEpoch(saleEndLocal) || session.ticketSaleEndAt,
        ticketTypes,
      })

      await updateSession.mutateAsync({
        eventId,
        sessionId: session.id,
        formData,
      })

      if (advance) {
        onNext()
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save tickets.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{EVENT_EDITOR_COPY.TICKETS_TITLE}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {EVENT_EDITOR_COPY.TICKETS_DESCRIPTION}
        </p>
      </div>

      {ticketTypes.length === 0 && !showForm ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <h2 className="text-lg font-semibold">{EVENT_EDITOR_COPY.SETUP_TICKETING}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {EVENT_EDITOR_COPY.SETUP_TICKETING_DESCRIPTION}
          </p>
          <Button
            type="button"
            variant="primary"
            className="mt-6"
            onClick={() => setShowForm(true)}
          >
            {EVENT_EDITOR_COPY.ADD_TICKETS}
          </Button>
        </div>
      ) : null}

      {ticketTypes.length > 0 ? (
        <ul className="space-y-3">
          {ticketTypes.map((ticket, index) => (
            <li
              key={`${ticket.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-medium">{ticket.name}</p>
                <p className="text-sm text-muted-foreground">
                  ₹{ticket.price} · {ticket.quantity} available
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {showForm || ticketTypes.length > 0 ? (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ticket-name">Ticket name *</Label>
              <Input
                id="ticket-name"
                value={draftTicket.name}
                onChange={(e) =>
                  setDraftTicket((current) => ({ ...current, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-price">Price</Label>
              <Input
                id="ticket-price"
                type="number"
                min={0}
                value={draftTicket.price}
                onChange={(e) =>
                  setDraftTicket((current) => ({
                    ...current,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-quantity">Quantity</Label>
              <Input
                id="ticket-quantity"
                type="number"
                min={1}
                value={draftTicket.quantity}
                onChange={(e) =>
                  setDraftTicket((current) => ({
                    ...current,
                    quantity: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={addTicket}>
            Add ticket
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sale-start">Ticket sale starts</Label>
          <Input
            id="sale-start"
            type="datetime-local"
            value={saleStartLocal}
            onChange={(e) => setSaleStartLocal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale-end">Ticket sale ends</Label>
          <Input
            id="sale-end"
            type="datetime-local"
            value={saleEndLocal}
            onChange={(e) => setSaleEndLocal(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {EVENT_EDITOR_COPY.BACK}
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={updateSession.isPending}
            onClick={() => void handleSave(false)}
          >
            {updateSession.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              EVENT_EDITOR_COPY.SAVE
            )}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={updateSession.isPending}
            onClick={() => void handleSave(true)}
          >
            {updateSession.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              EVENT_EDITOR_COPY.NEXT
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
