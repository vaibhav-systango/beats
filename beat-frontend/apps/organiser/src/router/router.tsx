import { createDashboardRouter } from '@beat/core'

import { ORGANISER_ROUTES } from '@/constants'
import { Events, Login } from '@/pages'
import { useAuthStore } from '@/store'

import { DashboardLayout } from './DashboardLayout'

export const router = createDashboardRouter({
  loginElement: <Login />,
  dashboardLayout: <DashboardLayout />,
  useAuth: useAuthStore,
  requireOnboarding: false,
  routes: [{ path: ORGANISER_ROUTES.EVENTS, element: <Events /> }],
})
