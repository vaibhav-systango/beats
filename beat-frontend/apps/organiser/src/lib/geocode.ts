export interface LocationSearchResult {
  id: string
  label: string
  latitude: number
  longitude: number
  city?: string
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    street?: string
    housenumber?: string
  }
}

function buildLabel(properties: PhotonFeature['properties']): string {
  const parts = [
    properties.name,
    properties.street,
    properties.housenumber,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean)

  return parts.join(', ')
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) {
    return []
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: '6',
    lang: 'en',
  })

  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`)
  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as { features?: PhotonFeature[] }
  const features = data.features ?? []

  return features.map((feature, index) => {
    const [longitude, latitude] = feature.geometry.coordinates
    const label = buildLabel(feature.properties) || trimmed

    return {
      id: `${latitude}-${longitude}-${index}`,
      label,
      latitude,
      longitude,
      city: feature.properties.city,
    }
  })
}
