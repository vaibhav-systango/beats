import { NavLink, useLocation } from 'react-router-dom'

import { ORGANISER_NAVIGATION } from '@/constants'

export function Sidebar() {
  const location = useLocation()

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-card/50 px-4 py-6 md:flex">
        <div className="mb-10 flex items-center gap-2 px-2 text-primary">
          <span className="text-xl font-bold tracking-tight text-white">BEATROOT</span>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
            Creator
          </span>
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
        <div className="flex items-center gap-2 text-primary">
          <span className="font-bold tracking-tight text-white">BEATROOT</span>
          <span className="rounded bg-primary/20 px-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Creator
          </span>
        </div>
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
    </>
  )
}
