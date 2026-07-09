import type { SessionLocation } from '@beat/types'
import { Button, Input, Label } from '@beat/ui'
import { useState } from 'react'

import { LocationSearchInput } from '@/components/LocationSearchInput/LocationSearchInput'
import { VenueMapPicker } from '@/components/VenueMapPicker/VenueMapPicker'
import { EVENT_EDITOR_COPY } from '@/constants'
import type { LocationSearchResult } from '@/lib/geocode'

export interface VenueLocationFieldsProps {
  venueName: string
  address: string
  city: string
  coordinates: SessionLocation
  showMapInitially?: boolean
  onVenueNameChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCityChange: (value: string) => void
  onCoordinatesChange: (coordinates: SessionLocation) => void
  onResetLocation: () => void
}

export function VenueLocationFields({
  venueName,
  address,
  city,
  coordinates,
  showMapInitially = false,
  onVenueNameChange,
  onAddressChange,
  onCityChange,
  onCoordinatesChange,
  onResetLocation,
}: VenueLocationFieldsProps) {
  const [mapVisible, setMapVisible] = useState(showMapInitially)

  const handleLocationSelect = (result: LocationSearchResult) => {
    onCoordinatesChange({
      latitude: result.latitude,
      longitude: result.longitude,
    })
    if (result.city) {
      onCityChange(result.city)
    }
    setMapVisible(true)
  }

  const handleReset = () => {
    onResetLocation()
    setMapVisible(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <LocationSearchInput
          id="venue-name"
          label="Location *"
          value={venueName}
          placeholder={EVENT_EDITOR_COPY.LOCATION_SEARCH_PLACEHOLDER}
          onValueChange={onVenueNameChange}
          onSelect={handleLocationSelect}
        />

        <div className="space-y-2">
          <Label htmlFor="venue-address">Address</Label>
          <textarea
            id="venue-address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            rows={3}
            placeholder="Full street address"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue-city">City *</Label>
          <Input
            id="venue-city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Mumbai"
          />
        </div>
      </div>

      <div className="space-y-2">
        {mapVisible ? (
          <>
            <VenueMapPicker
              coordinates={coordinates}
              onCoordinatesChange={onCoordinatesChange}
            />
            <p className="text-xs text-muted-foreground">
              Drag the pin to fine-tune the location. Lat {coordinates.latitude.toFixed(5)},
              Lng {coordinates.longitude.toFixed(5)}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-primary"
              onClick={handleReset}
            >
              ↺ Reset Location
            </Button>
          </>
        ) : (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
            Search and select a location to show the map
          </div>
        )}
      </div>
    </div>
  )
}
