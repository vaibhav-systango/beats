import type { LocationType } from '@beat/types'

import { LOCATION_TYPE_OPTIONS } from '@/constants'

export interface LocationTypeSelectorProps {
  value: LocationType
  onChange: (value: LocationType) => void
}

function LocationIcon({ type }: { type: LocationType }) {
  if (type === 'VENUE') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  }
  if (type === 'ONLINE') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LocationTypeSelector({ value, onChange }: LocationTypeSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {LOCATION_TYPE_OPTIONS.map((option) => {
        const isSelected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            disabled={option.disabled}
            onClick={() => onChange(option.id)}
            className={`relative rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500'
                : 'border-border hover:border-primary/50'
            } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isSelected ? (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                ✓
              </span>
            ) : null}
            <div className="mb-3 text-muted-foreground">
              <LocationIcon type={option.id} />
            </div>
            <p className="font-medium">{option.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
          </button>
        )
      })}
    </div>
  )
}
