import type { Metadata } from 'next'

import { BRAND_CONSTANTS } from '@/constants'

export function createDefaultMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    title: {
      default: BRAND_CONSTANTS.DEFAULT_TITLE,
      template: BRAND_CONSTANTS.TITLE_TEMPLATE,
    },
    description: BRAND_CONSTANTS.DEFAULT_DESCRIPTION,
    ...overrides,
  }
}

export function createPageMetadata(
  title: string,
  description: string
): Metadata {
  return createDefaultMetadata({ title, description })
}
