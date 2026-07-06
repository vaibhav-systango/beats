import {
  useCreateEventSession,
  useEventCategories,
  useUpdateEvent,
  useUpdateEventSession,
} from '@beat/api-client'
import { Button, Input, Label, Loader2 } from '@beat/ui'
import type { Event, EventSession, LocationType, SessionMode, SessionLocation } from '@beat/types'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { DateTimePicker, LocationTypeSelector, TimePicker, VenueLocationFields } from '@/components'
import {
  DEFAULT_VENUE_COORDINATES,
  EVENT_EDITOR_COPY,
  LOCATION_TYPE_TO_MODE,
  TIMEZONE_OPTIONS,
} from '@/constants'
import {
  buildSessionFormData,
  createDefaultTicketTypes,
  datetimeLocalToEpoch,
  epochToDatetimeLocal,
} from '@/lib/sessionFormData'

export interface BasicInfoStepProps {
  event: Event
  session?: EventSession
  onNext: () => void
}

function timeToDatetimeLocal(time: string, baseDate?: string): string {
  const date = baseDate || new Date().toISOString().slice(0, 10)
  return `${date}T${time}`
}

function datetimeLocalToTime(value: string): string {
  if (!value) {
    return '00:00'
  }
  return value.includes('T') ? value.split('T')[1]?.slice(0, 5) ?? '00:00' : value
}

export function BasicInfoStep({ event, session, onNext }: BasicInfoStepProps) {
  const location = useLocation()
  const initialLocationType =
    (location.state as { locationType?: LocationType } | null)?.locationType ??
    'VENUE'

  const updateEvent = useUpdateEvent()
  const createSession = useCreateEventSession()
  const updateSession = useUpdateEventSession()
  const { data: categoriesResponse } = useEventCategories({ limit: 100, offset: 0 })

  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [locationType, setLocationType] = useState<LocationType>(initialLocationType)
  const [venueName, setVenueName] = useState(session?.eventAddress?.venueName ?? '')
  const [address, setAddress] = useState(
    session?.eventAddress?.formattedAddress ?? session?.eventAddress?.addressLine1 ?? ''
  )
  const [city, setCity] = useState(session?.eventAddress?.city ?? '')
  const [coordinates, setCoordinates] = useState<SessionLocation>({
    longitude: session?.location?.longitude ?? DEFAULT_VENUE_COORDINATES.longitude,
    latitude: session?.location?.latitude ?? DEFAULT_VENUE_COORDINATES.latitude,
  })
  const [startAtLocal, setStartAtLocal] = useState(
    epochToDatetimeLocal(session?.startAt)
  )
  const [endAtLocal, setEndAtLocal] = useState(epochToDatetimeLocal(session?.endAt))
  const [startTime, setStartTime] = useState(datetimeLocalToTime(epochToDatetimeLocal(session?.startAt)))
  const [endTime, setEndTime] = useState(datetimeLocalToTime(epochToDatetimeLocal(session?.endAt)))
  const [timezone, setTimezone] = useState<string>(TIMEZONE_OPTIONS[0].value)
  const [capacity, setCapacity] = useState(String(session?.capacity ?? 100))
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    session?.categoryIds ?? []
  )
  const [error, setError] = useState<string | null>(null)

  const categories = categoriesResponse?.data ?? []
  const isSaving =
    updateEvent.isPending || createSession.isPending || updateSession.isPending
  const isVenue = locationType === 'VENUE'
  const isOnline = locationType === 'ONLINE'

  useEffect(() => {
    setTitle(event.title)
    setDescription(event.description)
  }, [event.title, event.description])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    )
  }

  const resetVenueLocation = () => {
    setCoordinates({
      longitude: DEFAULT_VENUE_COORDINATES.longitude,
      latitude: DEFAULT_VENUE_COORDINATES.latitude,
    })
  }

  const resolveDateTimes = (): { startAt: number; endAt: number } | null => {
    if (isOnline) {
      const today = new Date().toISOString().slice(0, 10)
      const start = datetimeLocalToEpoch(timeToDatetimeLocal(startTime, today))
      const end = datetimeLocalToEpoch(timeToDatetimeLocal(endTime, today))
      if (!startTime) {
        setError('Start time is required.')
        return null
      }
      return { startAt: start, endAt: end || start + 3_600_000 }
    }

    if (!startAtLocal || !endAtLocal) {
      setError('Start and end date/time are required.')
      return null
    }
    return {
      startAt: datetimeLocalToEpoch(startAtLocal),
      endAt: datetimeLocalToEpoch(endAtLocal),
    }
  }

  const handleSave = async (advance = false) => {
    setError(null)

    if (!title.trim()) {
      setError('Event name is required.')
      return
    }
    if (!description.trim()) {
      setError('Event description is required.')
      return
    }
    if (isVenue) {
      if (!venueName.trim()) {
        setError(EVENT_EDITOR_COPY.VENUE_NAME_REQUIRED)
        return
      }
      if (!city.trim()) {
        setError(EVENT_EDITOR_COPY.CITY_REQUIRED)
        return
      }
    }
    if (selectedCategoryIds.length === 0) {
      setError('Select at least one category.')
      return
    }

    const dateTimes = resolveDateTimes()
    if (!dateTimes) {
      return
    }

    const { startAt, endAt } = dateTimes
    const mode = LOCATION_TYPE_TO_MODE[locationType] as SessionMode | null

    if (!mode) {
      setError('Selected location type is not supported yet.')
      return
    }

    try {
      await updateEvent.mutateAsync({
        id: event.id,
        input: { title: title.trim(), description: description.trim() },
      })

      const sessionInput = {
        categoryIds: selectedCategoryIds,
        title: title.trim(),
        startAt,
        endAt,
        location: coordinates,
        eventAddress: {
          venueName: isVenue ? venueName.trim() : undefined,
          formattedAddress: isVenue ? address.trim() || venueName.trim() : 'Online',
          addressLine1: isVenue ? address.trim() : undefined,
          city: isVenue ? city.trim() : 'Online',
          state: isVenue ? '' : '',
          country: 'India',
          postalCode: '',
        },
        capacity: Number(capacity) || 100,
        mode,
        ticketSaleStartAt: Date.now(),
        ticketSaleEndAt: startAt,
        ticketTypes:
          session?.ticketTypes?.length
            ? session.ticketTypes
            : createDefaultTicketTypes(startAt),
      }

      const formData = buildSessionFormData(sessionInput)

      if (session?.id) {
        await updateSession.mutateAsync({
          eventId: event.id,
          sessionId: session.id,
          formData,
        })
      } else {
        await createSession.mutateAsync({ eventId: event.id, formData })
      }

      if (advance) {
        onNext()
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save.')
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">{EVENT_EDITOR_COPY.BASIC_INFO_TITLE}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {EVENT_EDITOR_COPY.BASIC_INFO_DESCRIPTION}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="basic-title">Event Name *</Label>
          <Input
            id="basic-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="basic-description">Event Description *</Label>
          <textarea
            id="basic-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <div>
          <h2 className="text-lg font-semibold">{EVENT_EDITOR_COPY.LOCATION_TITLE}</h2>
          <p className="text-sm text-muted-foreground">
            {EVENT_EDITOR_COPY.LOCATION_SUBTITLE}
          </p>
        </div>
        <p className="text-sm font-medium">{EVENT_EDITOR_COPY.LOCATION_QUESTION}</p>
        <LocationTypeSelector value={locationType} onChange={setLocationType} />

        {isVenue ? (
          <VenueLocationFields
            venueName={venueName}
            address={address}
            city={city}
            coordinates={coordinates}
            showMapInitially={Boolean(session?.location?.latitude && session?.location?.longitude)}
            onVenueNameChange={setVenueName}
            onAddressChange={setAddress}
            onCityChange={setCity}
            onCoordinatesChange={setCoordinates}
            onResetLocation={resetVenueLocation}
          />
        ) : null}
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">{EVENT_EDITOR_COPY.DATE_TIME_TITLE}</h2>

        {isOnline ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TimePicker
              id="start-time"
              label={EVENT_EDITOR_COPY.START_TIME_LABEL}
              value={startTime}
              onChange={setStartTime}
            />
            <TimePicker
              id="end-time"
              label={EVENT_EDITOR_COPY.END_TIME_LABEL}
              value={endTime}
              onChange={setEndTime}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="timezone">{EVENT_EDITOR_COPY.TIMEZONE_LABEL}</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <DateTimePicker
              id="start-at"
              label={EVENT_EDITOR_COPY.START_DATETIME_LABEL}
              value={startAtLocal}
              onChange={setStartAtLocal}
              disablePastDates
            />
            <DateTimePicker
              id="end-at"
              label={EVENT_EDITOR_COPY.END_DATETIME_LABEL}
              value={endAtLocal}
              onChange={setEndAtLocal}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="space-y-2">
          <Label>Categories *</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => void handleSave(false)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : EVENT_EDITOR_COPY.SAVE}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={isSaving}
          onClick={() => void handleSave(true)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : EVENT_EDITOR_COPY.NEXT}
        </Button>
      </div>
    </div>
  )
}
