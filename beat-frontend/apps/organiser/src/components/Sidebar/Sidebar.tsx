import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard/events', label: 'Events' },
]

export function Sidebar() {
  return (
    <aside className="w-56 border-r border-gray-200 bg-white p-4">
      <h2 className="mb-6 text-lg font-bold text-violet-600">Beat Organiser</h2>
      <nav className="space-y-1">
        {links.map((link) => (
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
