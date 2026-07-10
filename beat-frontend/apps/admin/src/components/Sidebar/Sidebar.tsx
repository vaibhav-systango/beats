import { BrandLogo } from '@beat/ui'
import { NavLink } from 'react-router-dom'

import { ADMIN_NAVIGATION } from '@/constants'

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card/50 px-4 py-6 md:flex">
      <div className="mb-10 px-2">
        <BrandLogo badge="Admin" />
      </div>

      <nav className="flex-1 space-y-1">
        {ADMIN_NAVIGATION.LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary font-medium text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
