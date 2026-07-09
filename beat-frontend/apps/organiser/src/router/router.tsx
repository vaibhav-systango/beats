import { createDashboardRouter } from '@beat/core'

import { DashboardLayout } from './DashboardLayout'
import { EventDetailLayout } from './EventDetailLayout'

import { ORGANISER_ROUTES } from '@/constants'
import { Events, EventCreate, Login } from '@/pages'
import { useAuthStore } from '@/store'


export const router = createDashboardRouter({
  loginElement: <Login />,
  dashboardLayout: <DashboardLayout />,
  useAuth: useAuthStore,
  requireOnboarding: false,
  routes: [
    { path: ORGANISER_ROUTES.EVENTS, element: <Events /> },
    { path: ORGANISER_ROUTES.EVENT_CREATE, element: <EventCreate /> },
    { path: ORGANISER_ROUTES.EVENT_DETAIL, element: <EventDetailLayout /> },
  ],
})
