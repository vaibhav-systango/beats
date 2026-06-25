import { NavLink } from 'react-router-dom'

import { ORGANISER_NAVIGATION } from '@/constants'

export function Sidebar() {
  return (
    <aside className="w-56 border-r border-gray-200 bg-white p-4">
      <h2 className="mb-6 text-lg font-bold text-violet-600">
        {ORGANISER_NAVIGATION.APP_TITLE}
      </h2>
      <nav className="space-y-1">
        {ORGANISER_NAVIGATION.LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-600'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
