import Link from 'next/link'

import { BRAND_CONSTANTS, NAV_LABELS, USER_ROUTES } from '@/constants'

export function Navbar() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={USER_ROUTES.HOME} className="text-xl font-bold text-primary">
          {BRAND_CONSTANTS.NAME}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href={USER_ROUTES.EVENTS}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {NAV_LABELS.EVENTS}
          </Link>
          <Link
            href={USER_ROUTES.LOGIN}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {NAV_LABELS.SIGN_IN}
          </Link>
        </div>
      </nav>
    </header>
  )
}
