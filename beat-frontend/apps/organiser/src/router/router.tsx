import { createDashboardRouter } from '@beat/core'

import { Events, Login } from '@/pages'
import { useAuthStore } from '@/store'

import { DashboardLayout } from './DashboardLayout'

export const router = createDashboardRouter({
  loginElement: <Login />,
  dashboardLayout: <DashboardLayout />,
  useAuth: useAuthStore,
  routes: [{ path: 'events', element: <Events /> }],
})
