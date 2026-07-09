import { cn } from '@beat/ui'
import type { ReactNode } from 'react'

export interface ActionFeedbackBannerProps {
  message: string
  variant?: 'success' | 'error'
  className?: string
  children?: ReactNode
}

export function ActionFeedbackBanner({
  message,
  variant = 'success',
  className,
}: ActionFeedbackBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        variant === 'success' &&
          'border-primary/20 bg-primary/10 text-foreground',
        variant === 'error' &&
          'border-destructive/20 bg-destructive/10 text-foreground',
        className
      )}
    >
      {message}
    </div>
  )
}
