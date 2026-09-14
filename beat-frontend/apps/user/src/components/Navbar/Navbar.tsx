'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'
import { BRAND_CONSTANTS, NAV_LABELS, USER_ROUTES } from '@/constants'
import { useAuthStore } from '@/store/auth.store'

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active =
    href === USER_ROUTES.HOME
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-foreground'
          : 'rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground'
      }
    >
      {children}
    </Link>
  )
}

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
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <nav className="flex w-full items-center justify-between gap-4 px-6 py-3.5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href={USER_ROUTES.HOME}
              className="group flex items-center gap-2.5"
            >
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 via-primary to-violet-500 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7)]">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_white/40,_transparent_55%)]" />
                <span className="relative text-sm font-black tracking-tight text-white">
                  b
                </span>
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {BRAND_CONSTANTS.NAME.toLowerCase()}
              </span>
            </Link>

            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-primary"
                aria-hidden
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Mumbai
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-0.5 md:flex">
              <NavLink href={USER_ROUTES.HOME}>{NAV_LABELS.DISCOVER}</NavLink>
              <NavLink href={USER_ROUTES.EVENTS}>{NAV_LABELS.SEARCH}</NavLink>
              <NavLink href={USER_ROUTES.MY_TICKETS}>{NAV_LABELS.MY_TICKETS}</NavLink>
              <NavLink href={USER_ROUTES.WALLET}>{NAV_LABELS.WALLET}</NavLink>
            </div>

            <ThemeToggle />

            {!isReady ? (
              <div
                className="h-10 w-24 animate-pulse rounded-full bg-secondary"
                aria-hidden
              />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-1.5 sm:pr-2">
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-white"
                >
                  {initials || 'U'}
                </span>
                <span className="hidden max-w-[8.5rem] truncate text-sm font-medium text-foreground sm:inline">
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {NAV_LABELS.SIGN_OUT}
                </button>
              </div>
            ) : (
              <Link
                href={USER_ROUTES.LOGIN}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-12px_hsl(var(--primary)/0.9)] transition hover:brightness-110"
              >
                {NAV_LABELS.SIGN_IN}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
