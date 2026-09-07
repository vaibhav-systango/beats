import beatDark from '../../assets/beat_dark.webp'
import beatLight from '../../assets/beat_light.webp'
import { cn } from '../../lib/cn'

export interface BrandLogoProps {
  /** Portal label shown beside the logo, e.g. "Creator" or "Admin". */
  badge?: string
  /** Renders a compact square mark (letter B) instead of the full logo. */
  compact?: boolean
  className?: string
  alt?: string
}

export function BrandLogo({
  badge,
  compact = false,
  className,
  alt = 'Beatroot',
}: BrandLogoProps) {
  const ariaLabel = badge ? `${alt} ${badge}` : alt

  if (compact) {
    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground',
          className
        )}
        aria-label={ariaLabel}
      >
        B
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <img
        src={beatLight.src}
        alt={alt}
        className="h-7 w-auto max-w-full dark:hidden"
        width={120}
        height={28}
      />
      <img
        src={beatDark.src}
        alt={alt}
        className="hidden h-7 w-auto max-w-full dark:block"
        width={120}
        height={28}
      />
      {badge ? (
        <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
          {badge}
        </span>
      ) : null}
    </div>
  )
}
