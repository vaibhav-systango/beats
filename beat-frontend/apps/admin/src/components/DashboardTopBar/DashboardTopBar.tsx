import { ThemeToggle } from '@/components/ThemeToggle'

/** Slim desktop top bar. Mobile hosts the toggle in the layout header instead. */
export function DashboardTopBar() {
  return (
    <div className="sticky top-0 z-40 hidden h-14 shrink-0 items-center justify-end border-b border-border bg-card/50 px-6 backdrop-blur-md md:flex">
      <ThemeToggle />
    </div>
  )
}
