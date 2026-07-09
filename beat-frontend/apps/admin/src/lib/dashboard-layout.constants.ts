/** Shared spacing for all admin dashboard main-content areas. */
export const DASHBOARD_PAGE_PADDING = 'p-4 md:p-6 lg:p-8'

/** Max-width caps for page content — always left-aligned, never centered. */
export const DASHBOARD_PAGE_MAX_WIDTH = {
  full: 'max-w-none',
  content: 'max-w-5xl',
  narrow: 'max-w-3xl',
} as const

export type DashboardPageWidth = keyof typeof DASHBOARD_PAGE_MAX_WIDTH
