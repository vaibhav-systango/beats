import { BrandLogo } from '@beat/ui'
import { Outlet } from 'react-router-dom'

import { DashboardTopBar, Sidebar, ThemeToggle } from '@/components'
import { useThemeEffect } from '@/hooks'
import { DASHBOARD_PAGE_PADDING } from '@/lib/dashboard-layout.constants'

export function DashboardLayout() {
  useThemeEffect()

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-background text-foreground md:h-[100dvh] md:max-h-[100dvh] md:flex-row md:overflow-hidden">
      <Sidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/50 p-4 backdrop-blur-md md:hidden">
          <BrandLogo badge="Admin" />
          <ThemeToggle />
        </header>
        <DashboardTopBar />
        <div className={`w-full min-w-0 ${DASHBOARD_PAGE_PADDING}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
