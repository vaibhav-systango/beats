import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components'

export function DashboardLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">
        <div className="container mx-auto max-w-6xl p-4 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
