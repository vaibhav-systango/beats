import { NavLink } from 'react-router-dom'
import { ShieldCheck } from '@beat/ui'

import { ADMIN_NAVIGATION } from '@/constants'

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#0a0a0a] px-4 py-6 md:flex">
      <div className="mb-10 flex items-center gap-2 px-2">
        <ShieldCheck className="h-6 w-6 text-red-500" />
        <span className="text-xl font-bold tracking-tight text-white">
          BR <span className="font-mono text-red-500">ADMIN</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {ADMIN_NAVIGATION.LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border border-red-500/20 bg-red-500/10 font-medium text-red-500'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
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
