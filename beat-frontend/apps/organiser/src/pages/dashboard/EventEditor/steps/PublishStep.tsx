import { useEventCategories, useSubmitEvent } from '@beat/api-client'
import { Button, Loader2 } from '@beat/ui'
import type { Event, EventSession } from '@beat/types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EVENT_EDITOR_COPY } from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'

export interface PublishStepProps {
  event: Event
  session?: EventSession
  onBack: () => void
}

export function PublishStep({ event, session, onBack }: PublishStepProps) {
  const navigate = useNavigate()
  const submitEvent = useSubmitEvent()
  const { data: categoriesResponse } = useEventCategories({ limit: 100, offset: 0 })

  const [listingType, setListingType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [allowDiscussions, setAllowDiscussions] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categories = categoriesResponse?.data ?? []
  const selectedCategories = categories.filter((category) =>
    session?.categoryIds?.includes(category.id)
  )

  const handlePublish = () => {
    setError(null)
    setMessage(null)

    submitEvent.mutate(event.id, {
      onSuccess: (response) => {
        setMessage(response.message ?? 'Event submitted for review.')
        setTimeout(() => {
          navigate(ORGANISER_PATHS.EVENTS)
        }, 1500)
      },
      onError: (submitError) => {
        setError(submitError.message)
      },
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{EVENT_EDITOR_COPY.PUBLISH_TITLE}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {EVENT_EDITOR_COPY.PUBLISH_DESCRIPTION}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event category</label>
            <p className="rounded-md border border-border px-3 py-2 text-sm">
              {selectedCategories.length
                ? selectedCategories.map((c) => c.name).join(', ')
                : 'No categories selected'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Listing type</label>
            <div className="flex gap-3">
              {(['PUBLIC', 'PRIVATE'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setListingType(type)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${
                    listingType === type
                      ? 'border-green-500 bg-green-50'
                      : 'border-border'
                  }`}
                >
                  {type === 'PUBLIC' ? 'Public' : 'Private'}
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-600">
              Listing visibility is UI-only until the backend adds a visibility field.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <span className="text-sm font-medium">Allow discussions on your event</span>
            <button
              type="button"
              role="switch"
              aria-checked={allowDiscussions}
              onClick={() => setAllowDiscussions((current) => !current)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                allowDiscussions ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  allowDiscussions ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 h-24 rounded-md bg-muted" />
          <p className="font-semibold">{event.title}</p>
          <p className="text-sm text-muted-foreground">
            {session?.eventAddress?.city ?? '—'}
          </p>
        </div>
      </div>

      {message ? (
        <div className="text-sm text-green-600" role="status">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="text-sm text-red-500" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {EVENT_EDITOR_COPY.BACK}
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            {EVENT_EDITOR_COPY.SAVE_DRAFT}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={submitEvent.isPending}
            onClick={handlePublish}
          >
            {submitEvent.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                {EVENT_EDITOR_COPY.PUBLISHING}
              </>
            ) : (
              EVENT_EDITOR_COPY.PUBLISH
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
