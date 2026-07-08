import { NavLink, useLocation } from 'react-router-dom'

import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from '@/components/Sidebar/SidebarIcons'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ORGANISER_NAVIGATION } from '@/constants'

export interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

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

function BrandMarkCompact() {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground"
      aria-label="Beatroot Creator"
    >
      B
    </div>
  )
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <div
      className={`flex w-full shrink-0 flex-col transition-[width] duration-200 ${
        collapsed ? 'md:w-16' : 'md:w-64'
      }`}
    >
      <aside
        className={`sticky top-0 hidden h-[100dvh] max-h-[100dvh] w-full shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-card/50 py-6 md:flex ${
          collapsed ? 'items-center px-2' : 'px-4'
        }`}
      >
        <div
          className={`mb-10 flex min-w-0 items-center ${
            collapsed ? 'justify-center' : 'justify-between px-2'
          } text-primary`}
        >
          {collapsed ? <BrandMarkCompact /> : <BrandMark />}
          {!collapsed && onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
            >
              <PanelLeftCloseIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {collapsed && onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="mb-4 rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
          >
            <PanelLeftOpenIcon className="h-5 w-5" />
          </button>
        ) : null}

        <nav className="flex w-full flex-1 flex-col gap-1">
          {ORGANISER_NAVIGATION.LINKS.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                title={collapsed ? link.label : undefined}
                aria-label={collapsed ? link.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl transition-colors ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed ? link.label : null}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-card/50 p-4 backdrop-blur-md md:hidden">
        <BrandMark />
        <ThemeToggle />
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/5 bg-card/90 p-2 backdrop-blur-md md:hidden">
        {ORGANISER_NAVIGATION.LINKS.map((link) => {
          const isActive = location.pathname === link.to
          const Icon = link.icon

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
