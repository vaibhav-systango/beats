import { cn } from '@beat/ui'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  DASHBOARD_PAGE_MAX_WIDTH,
  type DashboardPageWidth,
} from '@/lib/dashboard-layout.constants'

export interface DashboardPageProps {
  children: ReactNode
  className?: string
  width?: DashboardPageWidth
}

export function DashboardPage({
  children,
  className,
  width = 'full',
}: DashboardPageProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0',
        DASHBOARD_PAGE_MAX_WIDTH[width],
        className
      )}
    >
      {children}
    </div>
  )
}

export interface DashboardPageHeaderProps {
  title: string
  description?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
  className?: string
}

export function DashboardPageHeader({
  title,
  description,
  backTo,
  backLabel = 'Back',
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {backTo ? (
          <Link
            to={backTo}
            className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {backLabel}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}

export interface DashboardPageSectionProps {
  children: ReactNode
  className?: string
}

export function DashboardPageSection({ children, className }: DashboardPageSectionProps) {
  return (
    <section className={cn('rounded-lg border border-border bg-card', className)}>
      {children}
    </section>
  )
}
