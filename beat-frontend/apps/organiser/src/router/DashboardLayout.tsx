import { useEffect, useState } from 'react'
import { Outlet, useMatch } from 'react-router-dom'

import { DashboardTopBar, Sidebar } from '@/components'
import { useThemeEffect } from '@/hooks'
import { DASHBOARD_PAGE_PADDING } from '@/lib/dashboard-layout.constants'

export function DashboardLayout() {
  useThemeEffect()

  const eventEditorMatch = useMatch('/dashboard/events/:id/*')
  const isEventEditor =
    Boolean(eventEditorMatch) && eventEditorMatch?.params.id !== 'new'
  const eventId = eventEditorMatch?.params.id

  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    setSidebarExpanded(false)
  }, [eventId, isEventEditor])

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-background text-foreground md:h-[100dvh] md:max-h-[100dvh] md:flex-row md:overflow-hidden">
      {isEventEditor ? (
        <Sidebar
          collapsed={!sidebarExpanded}
          onToggle={() => setSidebarExpanded((value) => !value)}
        />
      ) : (
        <Sidebar />
      )}
      <main
        className={`min-h-0 min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0 ${
          isEventEditor
            ? 'flex flex-col overflow-y-auto md:overflow-hidden'
            : 'overflow-y-auto'
        }`}
      >
        <DashboardTopBar />
        {isEventEditor ? (
          <div className="flex min-h-0 w-full flex-1 flex-col md:overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <div className={`w-full min-w-0 ${DASHBOARD_PAGE_PADDING}`}>
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
