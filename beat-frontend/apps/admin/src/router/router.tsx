import { createDashboardRouter } from '@beat/core'
import { Navigate } from 'react-router-dom'

import { DashboardLayout } from './DashboardLayout'

import { ADMIN_PATHS, ADMIN_ROUTES } from '@/constants'
import { EventDetail, EventList, Login } from '@/pages'
import { useAuthStore } from '@/store'

export const router = createDashboardRouter({
  loginElement: <Login />,
  dashboardLayout: <DashboardLayout />,
  useAuth: useAuthStore,
  requireOnboarding: false,
  routes: [
    { path: ADMIN_ROUTES.EVENTS, element: <EventList /> },
    { path: ADMIN_ROUTES.EVENT_DETAIL, element: <EventDetail /> },
    {
      path: ADMIN_ROUTES.MODERATION,
      element: <Navigate to={ADMIN_PATHS.EVENTS} replace />,
    },
  ],
})
