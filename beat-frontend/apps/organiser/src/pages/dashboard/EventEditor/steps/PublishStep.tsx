import {
  getApiErrorMessage,
  SignedMediaImage,
  useCreateEventSession,
  useEventCategories,
  useSubmitEvent,
  useUpdateEventSession,
} from '@beat/api-client'
import type { Event, EventSession } from '@beat/types'
import { Button, Label, Loader2 } from '@beat/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MultiSelect } from '@/components'
import { EVENT_EDITOR_COPY } from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import { getPublicEventUrl } from '@/lib/eventPublicUrl'
import { buildSessionPatchFormData } from '@/lib/sessionFormData'
import { upsertSession } from '@/lib/sessionUpsert'
import { useEventDetailContext } from '@/router/eventDetailContext'

export interface PublishStepProps {
  event: Event
  session?: EventSession
  onBack: () => void
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}

export function PublishStep({ event, session, onBack }: PublishStepProps) {
  const navigate = useNavigate()
  const { onSessionCreated } = useEventDetailContext()
  const submitEvent = useSubmitEvent()
  const createSession = useCreateEventSession()
  const updateSession = useUpdateEventSession()
  const { data: categoriesResponse } = useEventCategories({ limit: 100, offset: 0 })

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    session?.categoryIds ?? session?.categories?.map((category) => category.id) ?? []
  )
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categories = categoriesResponse?.data ?? []
  const coverUrl = session?.eventSessionMedias?.cover?.url
  const locationLabel =
    session?.eventAddress?.venueName ??
    session?.eventAddress?.city ??
    (session?.mode === 'ONLINE' ? 'Online' : '—')
  const publicEventUrl = event.slug ? getPublicEventUrl(event.slug) : null
  const isSaving = submitEvent.isPending || createSession.isPending || updateSession.isPending

  const handleCategoryChange = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds)
    if (categoryIds.length > 0) {
      setCategoryError(null)
    }
  }

  const saveCategories = async () => {
    const formData = buildSessionPatchFormData({ categoryIds: selectedCategoryIds })
    const saved = await upsertSession(event.id, session?.id, formData, {
      create: (args) => createSession.mutateAsync(args),
      update: (args) => updateSession.mutateAsync(args),
    })
    if (!session?.id) {
      onSessionCreated(saved.id)
    }
  }

  const handleSaveDraft = async () => {
    setError(null)
    setMessage(null)

    try {
      await saveCategories()
      setMessage('Draft saved.')
    } catch (saveError) {
      const apiMessage = getApiErrorMessage(saveError)
      if (apiMessage) {
        setError(apiMessage)
      }
    }
  }

  const handlePublish = async () => {
    setError(null)
    setMessage(null)

    if (selectedCategoryIds.length === 0) {
      setCategoryError('Select at least one category for this session.')
      return
    }

    try {
      await saveCategories()
    } catch (saveError) {
      const apiMessage = getApiErrorMessage(saveError)
      if (apiMessage) {
        setError(apiMessage)
      }
      return
    }

    submitEvent.mutate(event.id, {
      onSuccess: (response) => {
        setMessage(response.message ?? 'Event submitted for review.')
        setTimeout(() => {
          navigate(ORGANISER_PATHS.EVENTS)
        }, 1500)
      },
      onError: (submitError) => {
        const apiMessage = getApiErrorMessage(submitError)
        if (apiMessage) {
          setError(apiMessage)
        }
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
          <div className="max-w-md space-y-2">
            <Label>Event category *</Label>
            <MultiSelect
              options={categories}
              selectedIds={selectedCategoryIds}
              onChange={handleCategoryChange}
              placeholder="Select one or more categories"
              invalid={Boolean(categoryError)}
              ariaLabel="Event category"
            />
            {categoryError ? (
              <p className="text-sm text-red-500" role="alert">
                {categoryError}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-border p-4">
            {coverUrl ? (
              <SignedMediaImage
                src={coverUrl}
                alt=""
                className="mb-3 h-24 w-full rounded-md object-cover"
              />
            ) : (
              <div className="mb-3 h-24 rounded-md bg-muted" />
            )}
            <p className="font-semibold leading-snug">{event.title}</p>
            <p className="text-sm text-muted-foreground">{locationLabel}</p>
          </div>
          {publicEventUrl ? (
            <a
              href={publicEventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {EVENT_EDITOR_COPY.VIEW_YOUR_EVENT}
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          ) : null}
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
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => void handleSaveDraft()}
          >
            {EVENT_EDITOR_COPY.SAVE_DRAFT}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isSaving}
            onClick={() => void handlePublish()}
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
