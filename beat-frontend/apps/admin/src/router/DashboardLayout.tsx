import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components'

export function DashboardLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="container mx-auto max-w-7xl p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
