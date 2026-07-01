'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { USER_ROUTES } from '@/constants'
import { useAuthStore } from '@/store/auth.store'

const AUTH_ROUTE_PREFIXES = [USER_ROUTES.LOGIN, USER_ROUTES.ONBOARDING]

export function OnboardingRedirect({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, needsOnboarding } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return

    const isAuthRoute = AUTH_ROUTE_PREFIXES.some((route) => pathname.startsWith(route))

    if (isAuthenticated && needsOnboarding && !isAuthRoute) {
      router.replace(USER_ROUTES.ONBOARDING)
    }
  }, [isReady, isAuthenticated, needsOnboarding, pathname, router])

  return <>{children}</>
}
