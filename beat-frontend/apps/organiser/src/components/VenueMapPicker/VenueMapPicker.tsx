import type { SessionLocation } from '@beat/types'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useEffect, useRef } from 'react'

import 'leaflet/dist/leaflet.css'

export interface VenueMapPickerProps {
  coordinates: SessionLocation
  onCoordinatesChange: (coordinates: SessionLocation) => void
}

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function VenueMapPicker({ coordinates, onCoordinatesChange }: VenueMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const map = L.map(containerRef.current, {
      center: [coordinates.latitude, coordinates.longitude],
      zoom: 14,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const marker = L.marker([coordinates.latitude, coordinates.longitude], {
      draggable: true,
      icon: defaultIcon,
    }).addTo(map)

    marker.on('dragend', () => {
      const position = marker.getLatLng()
      onCoordinatesChange({
        latitude: position.lat,
        longitude: position.lng,
      })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map initializes once
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) {
      return
    }

    const nextPosition = L.latLng(coordinates.latitude, coordinates.longitude)
    const currentPosition = marker.getLatLng()
    const hasMoved =
      Math.abs(currentPosition.lat - nextPosition.lat) > 0.000001 ||
      Math.abs(currentPosition.lng - nextPosition.lng) > 0.000001

    if (hasMoved) {
      marker.setLatLng(nextPosition)
      map.setView(nextPosition, map.getZoom(), { animate: true })
    }
  }, [coordinates.latitude, coordinates.longitude])

  return (
    <div
      ref={containerRef}
      className="h-[260px] w-full rounded-lg border border-border"
      aria-label="Venue location map"
    />
  )
}
