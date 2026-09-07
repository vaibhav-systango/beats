'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { BRAND_CONSTANTS, NAV_LABELS, USER_ROUTES } from '@/constants'
import { useAuthStore } from '@/store/auth.store'

export function Navbar() {
  const router = useRouter()
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  const handleSignOut = () => {
    clearAuth()
    router.push(USER_ROUTES.HOME)
  }

  const displayName = user?.fullName?.trim() || user?.phone || 'Account'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={USER_ROUTES.HOME} className="text-xl font-bold text-primary">
          {BRAND_CONSTANTS.NAME}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href={USER_ROUTES.HOME}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {NAV_LABELS.HOME}
          </Link>
          <Link
            href={USER_ROUTES.EVENTS}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {NAV_LABELS.EVENTS}
          </Link>

          {!isReady ? (
            <div className="h-9 w-20 rounded-md bg-muted/60" aria-hidden />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[10rem] truncate text-sm text-foreground sm:inline">
                {displayName}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {NAV_LABELS.SIGN_OUT}
              </button>
            </div>
          ) : (
            <Link
              href={USER_ROUTES.LOGIN}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {NAV_LABELS.SIGN_IN}
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
