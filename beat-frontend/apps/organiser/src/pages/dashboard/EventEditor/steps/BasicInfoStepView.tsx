import type { EventCategory, LocationType, SessionLocation } from '@beat/types'
import { Button, Input, Label, Loader2 } from '@beat/ui'

import { DateTimePicker, LocationTypeSelector, TimePicker, VenueLocationFields } from '@/components'

/** Presentational Basic Info step — container owns state, validation, and API calls. */
export interface BasicInfoStepViewProps {
  title: string
  description: string
  eventTitle: string
  eventDescription: string
  titleError?: string | null
  descriptionError?: string | null
  locationTitle: string
  locationSubtitle: string
  locationQuestion: string
  locationType: LocationType
  onLocationTypeChange: (value: LocationType) => void
  isVenue: boolean
  isOnline: boolean
  venueName: string
  address: string
  city: string
  coordinates: SessionLocation
  showMapInitially: boolean
  onVenueNameChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCityChange: (value: string) => void
  onCoordinatesChange: (value: SessionLocation) => void
  onResetLocation: () => void
  dateTimeTitle: string
  startTimeLabel: string
  endTimeLabel: string
  timezoneLabel: string
  startDatetimeLabel: string
  endDatetimeLabel: string
  startTime: string
  endTime: string
  timezone: string
  timezoneOptions: ReadonlyArray<{ value: string; label: string }>
  startAtLocal: string
  endAtLocal: string
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onTimezoneChange: (value: string) => void
  onStartAtLocalChange: (value: string) => void
  onEndAtLocalChange: (value: string) => void
  capacity: string
  capacityError?: string | null
  onCapacityChange: (value: string) => void
  onCapacityBlur: () => void
  categories: EventCategory[]
  selectedCategoryId: string
  categoryError?: string | null
  onCategorySelect: (categoryId: string) => void
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onDescriptionChange: (value: string) => void
  onDescriptionBlur: () => void
  error?: string | null
  isSaving: boolean
  saveLabel: string
  nextLabel: string
  onSaveDraft: () => void
  onSaveAndNext: () => void
}

export function BasicInfoStepView({
  title,
  description,
  eventTitle,
  eventDescription,
  titleError,
  descriptionError,
  locationTitle,
  locationSubtitle,
  locationQuestion,
  locationType,
  onLocationTypeChange,
  isVenue,
  isOnline,
  venueName,
  address,
  city,
  coordinates,
  showMapInitially,
  onVenueNameChange,
  onAddressChange,
  onCityChange,
  onCoordinatesChange,
  onResetLocation,
  dateTimeTitle,
  startTimeLabel,
  endTimeLabel,
  timezoneLabel,
  startDatetimeLabel,
  endDatetimeLabel,
  startTime,
  endTime,
  timezone,
  timezoneOptions,
  startAtLocal,
  endAtLocal,
  onStartTimeChange,
  onEndTimeChange,
  onTimezoneChange,
  onStartAtLocalChange,
  onEndAtLocalChange,
  capacity,
  capacityError,
  onCapacityChange,
  onCapacityBlur,
  categories,
  selectedCategoryId,
  categoryError,
  onCategorySelect,
  onTitleChange,
  onTitleBlur,
  onDescriptionChange,
  onDescriptionBlur,
  error,
  isSaving,
  saveLabel,
  nextLabel,
  onSaveDraft,
  onSaveAndNext,
}: BasicInfoStepViewProps) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="basic-title">Event Name *</Label>
          <Input
            id="basic-title"
            value={eventTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            aria-invalid={Boolean(titleError)}
          />
          {titleError ? (
            <p className="text-sm text-red-500" role="alert">
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="basic-description">Event Description *</Label>
          <textarea
            id="basic-description"
            value={eventDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onBlur={onDescriptionBlur}
            rows={6}
            aria-invalid={Boolean(descriptionError)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {descriptionError ? (
            <p className="text-sm text-red-500" role="alert">
              {descriptionError}
            </p>
          ) : null}
        </div>
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <div>
          <h2 className="text-lg font-semibold">{locationTitle}</h2>
          <p className="text-sm text-muted-foreground">{locationSubtitle}</p>
        </div>
        <p className="text-sm font-medium">{locationQuestion}</p>
        <LocationTypeSelector value={locationType} onChange={onLocationTypeChange} />

        {isVenue ? (
          <VenueLocationFields
            venueName={venueName}
            address={address}
            city={city}
            coordinates={coordinates}
            showMapInitially={showMapInitially}
            onVenueNameChange={onVenueNameChange}
            onAddressChange={onAddressChange}
            onCityChange={onCityChange}
            onCoordinatesChange={onCoordinatesChange}
            onResetLocation={onResetLocation}
          />
        ) : null}
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">{dateTimeTitle}</h2>

        {isOnline ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TimePicker
              id="start-time"
              label={startTimeLabel}
              value={startTime}
              onChange={onStartTimeChange}
            />
            <TimePicker
              id="end-time"
              label={endTimeLabel}
              value={endTime}
              onChange={onEndTimeChange}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="timezone">{timezoneLabel}</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => onTimezoneChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {timezoneOptions.map((option) => (
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
              label={startDatetimeLabel}
              value={startAtLocal}
              onChange={onStartAtLocalChange}
              disablePastDates
              disablePastTimes
            />
            <DateTimePicker
              id="end-at"
              label={endDatetimeLabel}
              value={endAtLocal}
              onChange={onEndAtLocalChange}
              minDateTime={startAtLocal || undefined}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => onCapacityChange(e.target.value)}
            onBlur={onCapacityBlur}
            aria-invalid={Boolean(capacityError)}
            className="max-w-xs"
          />
          {capacityError ? (
            <p className="text-sm text-red-500" role="alert">
              {capacityError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event category">
            {categories.map((category) => {
              const isSelected = selectedCategoryId === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onCategorySelect(category.id)}
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
          {categoryError ? (
            <p className="text-sm text-red-500" role="alert">
              {categoryError}
            </p>
          ) : null}
        </div>
      </section>

      {error ? (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onSaveDraft}>
          {isSaving ? <Loader2 className="animate-spin" /> : saveLabel}
        </Button>
        <Button type="button" variant="primary" disabled={isSaving} onClick={onSaveAndNext}>
          {isSaving ? <Loader2 className="animate-spin" /> : nextLabel}
        </Button>
      </div>
    </div>
  )
}
