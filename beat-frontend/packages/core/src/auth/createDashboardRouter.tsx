import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { DASHBOARD_ROUTES } from '../constants/routes.constants'
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
  loginPath?: string
  dashboardPath?: string
  rootElement?: ReactNode
}

export function createDashboardRouter({
  loginElement,
  dashboardLayout,
  useAuth,
  routes,
  loginPath = DASHBOARD_ROUTES.LOGIN,
  dashboardPath = DASHBOARD_ROUTES.DASHBOARD,
  rootElement,
}: CreateDashboardRouterConfig) {
  return createBrowserRouter([
    { path: loginPath, element: loginElement },
    {
      path: dashboardPath,
      element: (
        <ProtectedRoute useAuth={useAuth} loginPath={loginPath}>
          {dashboardLayout}
        </ProtectedRoute>
      ),
      children: routes,
    },
    { path: '/', element: rootElement ?? loginElement },
  ])
}
