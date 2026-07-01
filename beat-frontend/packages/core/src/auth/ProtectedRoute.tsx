import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { DASHBOARD_ROUTES } from '../constants/routes.constants'
import type { AuthSelector } from './types'

export interface ProtectedRouteProps {
  children: ReactNode
  useAuth: AuthSelector
  loginPath?: string
  onboardingPath?: string
  requireOnboarding?: boolean
}

export function ProtectedRoute({
  children,
  useAuth,
  loginPath = DASHBOARD_ROUTES.LOGIN,
  onboardingPath = DASHBOARD_ROUTES.ONBOARDING,
  requireOnboarding = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, needsOnboarding } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (requireOnboarding && needsOnboarding) {
    return <Navigate to={onboardingPath} replace />
  }

  return <>{children}</>
}
