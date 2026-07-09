import type { ComponentType } from 'react'

import { ORGANISER_PATHS } from './routes.constants'

import { CalendarIcon } from '@/components/Sidebar/SidebarIcons'

export interface OrganiserNavLink {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export const ORGANISER_NAVIGATION = {
  APP_TITLE: 'Beat Organiser',
  LINKS: [
    { to: ORGANISER_PATHS.EVENTS, label: 'Events', icon: CalendarIcon },
  ] as OrganiserNavLink[],
} as const
