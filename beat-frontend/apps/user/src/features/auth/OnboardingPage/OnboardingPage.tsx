'use client'

import { OnboardingPage as CoreOnboardingPage } from '@beat/core'
import { getAccessToken } from '@beat/api-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ONBOARDING_COPY, USER_ROUTES } from '@/constants'
import { useAuthStore } from '@/store/auth.store'

export function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, needsOnboarding } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return

    const hasToken = Boolean(getAccessToken())

    if (!isAuthenticated && !hasToken) {
      router.replace(USER_ROUTES.LOGIN)
      return
    }

    if (!needsOnboarding) {
      router.replace(USER_ROUTES.HOME)
    }
  }, [isReady, isAuthenticated, needsOnboarding, router])

  if (!isReady || (!isAuthenticated && !getAccessToken()) || !needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <CoreOnboardingPage
      useAuthStore={useAuthStore}
      copy={ONBOARDING_COPY}
      onSuccess={() => router.replace(USER_ROUTES.HOME)}
    />
  )
}
