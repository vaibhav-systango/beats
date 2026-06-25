import type { Metadata } from 'next'

export function createDefaultMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    title: {
      default: 'Beats — Event Ticketing Platform',
      template: '%s | Beats',
    },
    description:
      'Discover and book tickets for concerts, festivals, sports, and live events across India.',
    ...overrides,
  }
}

export function createPageMetadata(
  title: string,
  description: string
): Metadata {
  return createDefaultMetadata({ title, description })
}
