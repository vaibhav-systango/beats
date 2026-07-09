import { Button, Label } from '@beat/ui'
import { useEffect, useId, useState } from 'react'

import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'

export interface RejectEventDialogProps {
  open: boolean
  eventTitle: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  isLoading?: boolean
}

export function RejectEventDialog({
  open,
  eventTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}: RejectEventDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const reasonId = useId()
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) {
      setReason('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, isLoading, onCancel])

  if (!open) {
    return null
  }

  const trimmedReason = reason.trim()
  const canSubmit = trimmedReason.length > 0 && !isLoading

  const handleSubmit = () => {
    if (!canSubmit) {
      return
    }
    onConfirm(trimmedReason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={ADMIN_EVENTS_COPY.REJECT_DIALOG_CLOSE}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
        disabled={isLoading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {ADMIN_EVENTS_COPY.REJECT_DIALOG_TITLE}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
          {ADMIN_EVENTS_COPY.REJECT_DIALOG_DESCRIPTION_PREFIX}{' '}
          <span className="font-medium text-foreground">{eventTitle}</span>
          {ADMIN_EVENTS_COPY.REJECT_DIALOG_DESCRIPTION_SUFFIX}
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor={reasonId}>{ADMIN_EVENTS_COPY.REJECT_REASON_LABEL}</Label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            disabled={isLoading}
            placeholder={ADMIN_EVENTS_COPY.REJECT_REASON_PLACEHOLDER}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel}>
            {ADMIN_EVENTS_COPY.REJECT_DIALOG_CANCEL}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isLoading
              ? ADMIN_EVENTS_COPY.REJECT_DIALOG_SUBMITTING
              : ADMIN_EVENTS_COPY.REJECT_DIALOG_SUBMIT}
          </Button>
        </div>
      </div>
    </div>
  )
}
