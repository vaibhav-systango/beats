import { Label } from '@beat/ui'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  formatTimeDisplay,
  getDefaultDateTimeParts,
  parseTimeValue,
  to12Hour,
  to24Hour,
  toTimeValue,
} from '@/lib/dateTimePicker'

export interface TimePickerProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
}

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

export function TimePicker({ id, label, value, onChange }: TimePickerProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const parsed = parseTimeValue(value) ?? {
    hour: getDefaultDateTimeParts().hour,
    minute: 0,
  }
  const { hour: hour12, period } = to12Hour(parsed.hour)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = useMemo(() => formatTimeDisplay(value), [value])

  const updateTime = (nextHour12: number, nextMinute: number, nextPeriod: 'AM' | 'PM') => {
    onChange(toTimeValue(to24Hour(nextHour12, nextPeriod), nextMinute))
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={isOpen}
        aria-controls={listId}
      >
        <CalendarClockIcon />
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || 'Select time'}
        </span>
      </button>

      {isOpen ? (
        <div
          id={listId}
          className="absolute z-20 mt-1 w-full min-w-[240px] rounded-md border border-border bg-popover p-3 shadow-md"
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hour</p>
              <select
                value={hour12}
                onChange={(e) =>
                  updateTime(Number(e.target.value), parsed.minute, period)
                }
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Minute</p>
              <select
                value={parsed.minute}
                onChange={(e) => updateTime(hour12, Number(e.target.value), period)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {MINUTES.map((minute) => (
                  <option key={minute} value={minute}>
                    {String(minute).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Period</p>
              <select
                value={period}
                onChange={(e) =>
                  updateTime(hour12, parsed.minute, e.target.value as 'AM' | 'PM')
                }
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CalendarClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
