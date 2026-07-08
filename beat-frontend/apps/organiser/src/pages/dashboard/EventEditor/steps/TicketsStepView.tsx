import type { SessionTicketType } from '@beat/types'
import { Button, Input, Label, Loader2 } from '@beat/ui'

import { DateTimePicker } from '@/components'

/** Presentational Tickets step — container owns state, validation, and API calls. */
export interface TicketsStepViewProps {
  title: string
  description: string
  setupTitle: string
  setupDescription: string
  addTicketsLabel: string
  ticketTypes: SessionTicketType[]
  showForm: boolean
  draftTicket: SessionTicketType
  saleStartLocal: string
  saleEndLocal: string
  saleWindowError?: string | null
  error?: string | null
  isSaving: boolean
  backLabel: string
  nextLabel: string
  onShowForm: () => void
  onRemoveTicket: (index: number) => void
  onDraftNameChange: (value: string) => void
  onDraftPriceChange: (value: number) => void
  onDraftQuantityChange: (value: number) => void
  onAddTicket: () => void
  onSaleStartChange: (value: string) => void
  onSaleEndChange: (value: string) => void
  onBack: () => void
  onSaveAndNext: () => void
}

export function TicketsStepView({
  title,
  description,
  setupTitle,
  setupDescription,
  addTicketsLabel,
  ticketTypes,
  showForm,
  draftTicket,
  saleStartLocal,
  saleEndLocal,
  saleWindowError,
  error,
  isSaving,
  backLabel,
  nextLabel,
  onShowForm,
  onRemoveTicket,
  onDraftNameChange,
  onDraftPriceChange,
  onDraftQuantityChange,
  onAddTicket,
  onSaleStartChange,
  onSaleEndChange,
  onBack,
  onSaveAndNext,
}: TicketsStepViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {ticketTypes.length === 0 && !showForm ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <h2 className="text-lg font-semibold">{setupTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{setupDescription}</p>
          <Button type="button" variant="primary" className="mt-6" onClick={onShowForm}>
            {addTicketsLabel}
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
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveTicket(index)}>
                Remove
              </Button>
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
                onChange={(e) => onDraftNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-price">Price</Label>
              <Input
                id="ticket-price"
                type="number"
                min={0}
                value={draftTicket.price}
                onChange={(e) => onDraftPriceChange(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-quantity">Quantity</Label>
              <Input
                id="ticket-quantity"
                type="number"
                min={1}
                value={draftTicket.quantity}
                onChange={(e) => onDraftQuantityChange(Number(e.target.value))}
              />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={onAddTicket}>
            Add ticket
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimePicker
          id="sale-start"
          label="Ticket sale starts"
          value={saleStartLocal}
          onChange={onSaleStartChange}
          disablePastDates
          disablePastTimes
        />
        <DateTimePicker
          id="sale-end"
          label="Ticket sale ends"
          value={saleEndLocal}
          onChange={onSaleEndChange}
          minDateTime={saleStartLocal || undefined}
        />
      </div>

      {saleWindowError ? (
        <p className="text-sm text-red-500" role="alert">
          {saleWindowError}
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
        <Button type="button" variant="primary" disabled={isSaving} onClick={onSaveAndNext}>
          {isSaving ? <Loader2 className="animate-spin" /> : nextLabel}
        </Button>
      </div>
    </div>
  )
}
