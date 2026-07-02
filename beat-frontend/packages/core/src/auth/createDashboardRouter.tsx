import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { DASHBOARD_ROUTES } from '../constants/routes.constants'
import { OnboardingRoute } from './OnboardingRoute'
import { ProtectedRoute } from './ProtectedRoute'
import type { AuthSelector } from './types'

export interface DashboardRouteConfig {
  path: string
  element: ReactNode
}

export interface CreateDashboardRouterConfig {
  loginElement: ReactNode
  dashboardLayout: ReactNode
  useAuth: AuthSelector
  routes: DashboardRouteConfig[]
  onboardingElement?: ReactNode
  loginPath?: string
  onboardingPath?: string
  dashboardPath?: string
  requireOnboarding?: boolean
  rootElement?: ReactNode
}

export function createDashboardRouter({
  loginElement,
  dashboardLayout,
  useAuth,
  routes,
  onboardingElement,
  loginPath = DASHBOARD_ROUTES.LOGIN,
  onboardingPath = DASHBOARD_ROUTES.ONBOARDING,
  dashboardPath = DASHBOARD_ROUTES.DASHBOARD,
  requireOnboarding = true,
  rootElement,
}: CreateDashboardRouterConfig) {
  const routerRoutes = [
    { path: loginPath, element: loginElement },
    ...(onboardingElement
      ? [
          {
            path: onboardingPath,
            element: (
              <OnboardingRoute
                useAuth={useAuth}
                loginPath={loginPath}
                dashboardPath={dashboardPath}
              >
                {onboardingElement}
              </OnboardingRoute>
            ),
          },
        ]
      : []),
    {
      path: dashboardPath,
      element: (
        <ProtectedRoute
          useAuth={useAuth}
          loginPath={loginPath}
          onboardingPath={onboardingPath}
          requireOnboarding={requireOnboarding}
        >
          {dashboardLayout}
        </ProtectedRoute>
      ),
      children: routes,
    },
    {
      path: DASHBOARD_ROUTES.ROOT,
      element: rootElement ?? <Navigate to={loginPath} replace />,
    },
  ]

  return createBrowserRouter(routerRoutes)
}
