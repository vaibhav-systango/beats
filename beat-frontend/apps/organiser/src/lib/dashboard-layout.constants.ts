/** Shared spacing for all organiser dashboard main-content areas. */
export const DASHBOARD_PAGE_PADDING = 'p-4 md:p-6 lg:p-8'

export const DASHBOARD_EDITOR_SIDEBAR_PADDING = 'p-4 md:p-6 lg:p-8 lg:pr-6'

export const DASHBOARD_EDITOR_CONTENT_PADDING = 'p-4 md:p-6 lg:p-8 lg:pl-6'

/** Max-width caps for page content — always left-aligned, never centered. */
export const DASHBOARD_PAGE_MAX_WIDTH = {
  full: 'max-w-none',
  content: 'max-w-5xl',
  narrow: 'max-w-3xl',
} as const

export type DashboardPageWidth = keyof typeof DASHBOARD_PAGE_MAX_WIDTH
