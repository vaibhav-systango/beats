import { useCreateEvent } from '@beat/core'
import type { LocationType } from '@beat/types'
import { Button, Input, Label, Loader2 } from '@beat/ui'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  DashboardPage,
  DashboardPageHeader,
  EventDescriptionEditor,
  LocationTypeSelector,
} from '@/components'
import {
  EVENT_CREATE_COPY,
} from '@/constants'
import { ORGANISER_PATHS } from '@/constants/routes.constants'
import { slugify } from '@/lib/slugify'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function EventCreate() {
  const navigate = useNavigate()
  const createEvent = useCreateEvent()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [locationType, setLocationType] = useState<LocationType>('VENUE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title))
    }
  }, [title, slugTouched])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!stripHtml(description)) {
      setError(EVENT_CREATE_COPY.DESCRIPTION_REQUIRED)
      return
    }

    createEvent.mutate(
      {
        title,
        description,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      },
      {
        onSuccess: (createdEvent) => {
          navigate(
            `${ORGANISER_PATHS.eventDetail(createdEvent.id)}?step=basic-info`,
            { state: { locationType } }
          )
        },
        onError: (mutationError) => {
          setError(mutationError.message)
        },
      }
    )
  }

  return (
    <DashboardPage width="narrow">
      <DashboardPageHeader
        title={EVENT_CREATE_COPY.TITLE}
        backTo={ORGANISER_PATHS.EVENTS}
        backLabel="Back to events"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="event-title">{EVENT_CREATE_COPY.EVENT_NAME_LABEL}</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={EVENT_CREATE_COPY.EVENT_NAME_PLACEHOLDER}
            required
            minLength={3}
          />
        </div>

        <EventDescriptionEditor
          id="event-description"
          label={EVENT_CREATE_COPY.DESCRIPTION_LABEL}
          value={description}
          onChange={setDescription}
          placeholder={EVENT_CREATE_COPY.DESCRIPTION_PLACEHOLDER}
        />

        <div className="space-y-2">
          <Label htmlFor="event-slug">{EVENT_CREATE_COPY.SLUG_LABEL}</Label>
          <Input
            id="event-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder={EVENT_CREATE_COPY.SLUG_PLACEHOLDER}
          />
          <p className="text-xs text-muted-foreground">{EVENT_CREATE_COPY.SLUG_HELP}</p>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{EVENT_CREATE_COPY.LOCATION_TITLE}</h2>
            <p className="text-sm text-muted-foreground">
              {EVENT_CREATE_COPY.LOCATION_SUBTITLE}
            </p>
          </div>
          <p className="text-sm font-medium">{EVENT_CREATE_COPY.LOCATION_QUESTION}</p>
          <LocationTypeSelector value={locationType} onChange={setLocationType} />
        </div>

        {error && (
          <div role="alert" className="text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={createEvent.isPending}>
            {createEvent.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                {EVENT_CREATE_COPY.SUBMITTING_LABEL}
              </>
            ) : (
              EVENT_CREATE_COPY.SUBMIT_LABEL
            )}
          </Button>
        </div>
      </form>
    </DashboardPage>
  )
}
