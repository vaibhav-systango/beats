'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
          ? 'rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
          : 'rounded-full px-3.5 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white'
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
      <div className="border-b border-white/10 bg-[hsl(240_16%_5%/0.78)] backdrop-blur-xl">
        <nav className="flex w-full items-center justify-between gap-4 px-6 py-3.5">
          <Link
            href={USER_ROUTES.HOME}
            className="group flex items-center gap-2.5"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-accent shadow-[0_0_24px_-6px_hsl(var(--primary)/0.8)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_white/35,_transparent_55%)]" />
              <span className="relative text-sm font-black tracking-tight text-white">
                B
              </span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-primary">
                {BRAND_CONSTANTS.NAME}
              </span>
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
                Live city nights
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 sm:flex">
              <NavLink href={USER_ROUTES.HOME}>{NAV_LABELS.HOME}</NavLink>
              <NavLink href={USER_ROUTES.EVENTS}>{NAV_LABELS.EVENTS}</NavLink>
            </div>

            <div className="flex items-center gap-1 sm:hidden">
              <NavLink href={USER_ROUTES.HOME}>{NAV_LABELS.HOME}</NavLink>
              <NavLink href={USER_ROUTES.EVENTS}>{NAV_LABELS.EVENTS}</NavLink>
            </div>

            {!isReady ? (
              <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" aria-hidden />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-1.5 sm:pr-2">
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-accent/80 text-xs font-bold text-white"
                >
                  {initials || 'U'}
                </span>
                <span className="hidden max-w-[8.5rem] truncate text-sm font-medium text-white/90 sm:inline">
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full px-2.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {NAV_LABELS.SIGN_OUT}
                </button>
              </div>
            ) : (
              <Link
                href={USER_ROUTES.LOGIN}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.9)] transition hover:bg-primary/90"
              >
                {NAV_LABELS.SIGN_IN}
              </Link>
            )}
          </div>
        </nav>
      </div>
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
    </header>
  )
}
