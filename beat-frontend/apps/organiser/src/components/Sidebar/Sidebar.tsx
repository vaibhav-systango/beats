import { NavLink, useLocation } from 'react-router-dom'

import { ThemeToggle } from '@/components/ThemeToggle'
import { ORGANISER_NAVIGATION } from '@/constants'

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img
        src="/beat_light.webp"
        alt="Beatroot"
        className="h-7 w-auto max-w-full dark:hidden"
        width={120}
        height={28}
      />
      <img
        src="/beat_dark.webp"
        alt="Beatroot"
        className="hidden h-7 w-auto max-w-full dark:block"
        width={120}
        height={28}
      />
      <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
        Creator
      </span>
    </div>
  )
}

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex w-full shrink-0 flex-col md:w-64">
      <aside className="sticky top-0 hidden h-[100dvh] max-h-[100dvh] w-full shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-card/50 px-4 py-6 md:flex">
        <div className="mb-10 min-w-0 px-2 text-primary">
          <BrandMark />
        </div>

        <nav className="flex-1 space-y-1">
          {ORGANISER_NAVIGATION.LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-card/50 p-4 backdrop-blur-md md:hidden">
        <BrandMark />
        <ThemeToggle />
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/5 bg-card/90 p-2 backdrop-blur-md md:hidden">
        {ORGANISER_NAVIGATION.LINKS.map((link) => {
          const isActive = location.pathname === link.to

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <span className="text-[10px] font-medium">{link.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
