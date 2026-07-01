import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { DASHBOARD_ROUTES } from '../constants/routes.constants'
import type { AuthSelector } from './types'

export interface OnboardingRouteProps {
  children: ReactNode
  useAuth: AuthSelector
  loginPath?: string
  dashboardPath?: string
}

export function OnboardingRoute({
  children,
  useAuth,
  loginPath = DASHBOARD_ROUTES.LOGIN,
  dashboardPath = DASHBOARD_ROUTES.DASHBOARD,
}: OnboardingRouteProps) {
  const { isAuthenticated, needsOnboarding } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (!needsOnboarding) {
    return <Navigate to={dashboardPath} replace />
  }

  return <>{children}</>
}
