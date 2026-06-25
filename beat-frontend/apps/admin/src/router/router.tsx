import { createDashboardRouter } from '@beat/core'

import { ADMIN_ROUTES } from '@/constants'
import { EventModeration, Login } from '@/pages'
import { useAuthStore } from '@/store'

import { DashboardLayout } from './DashboardLayout'

export const router = createDashboardRouter({
  loginElement: <Login />,
  dashboardLayout: <DashboardLayout />,
  useAuth: useAuthStore,
  routes: [{ path: ADMIN_ROUTES.MODERATION, element: <EventModeration /> }],
})
