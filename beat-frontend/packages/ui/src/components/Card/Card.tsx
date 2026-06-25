import { type ReactNode } from 'react'

import { cn } from '../../lib/cn'

export interface CardProps {
  children: ReactNode
  className?: string
  header?: ReactNode
  footer?: ReactNode
}

export function Card({ children, className, header, footer }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        className
      )}
    >
      {header && (
        <div className="border-b border-gray-200 px-6 py-4">{header}</div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="border-t border-gray-200 px-6 py-4">{footer}</div>
      )}
    </div>
  )
}
