import { Button, Label } from '@beat/ui'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  formatDatetimeDisplay,
  getCalendarCells,
  getDefaultDateTimeParts,
  getWeekdayLabels,
  isBeforeDay,
  isSameDay,
  parseDatetimeLocal,
  to12Hour,
  to24Hour,
  toDatetimeLocal,
  type DateTimeParts,
} from '@/lib/dateTimePicker'

export interface DateTimePickerProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  disablePastDates?: boolean
}

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

export function DateTimePicker({
  id,
  label,
  value,
  onChange,
  disablePastDates = false,
}: DateTimePickerProps) {
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const selectedParts = parseDatetimeLocal(value) ?? getDefaultDateTimeParts()
  const [viewMonth, setViewMonth] = useState(selectedParts.month)
  const [viewYear, setViewYear] = useState(selectedParts.year)

  const { hour: hour12, period } = to12Hour(selectedParts.hour)
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  useEffect(() => {
    const parts = parseDatetimeLocal(value)
    if (parts) {
      setViewMonth(parts.month)
      setViewYear(parts.year)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = useMemo(() => formatDatetimeDisplay(value), [value])
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
  const cells = getCalendarCells(viewYear, viewMonth)
  const selectedDate = new Date(
    selectedParts.year,
    selectedParts.month,
    selectedParts.day
  )

  const updateParts = (next: Partial<DateTimeParts>) => {
    onChange(toDatetimeLocal({ ...selectedParts, ...next }))
  }

  const selectDate = (date: Date) => {
    if (disablePastDates && isBeforeDay(date, today)) {
      return
    }

    updateParts({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    })
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewMonth(next.getMonth())
    setViewYear(next.getFullYear())
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
        aria-controls={panelId}
      >
        <CalendarIcon />
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || 'Select date and time'}
        </span>
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="absolute z-20 mt-1 w-full min-w-[300px] rounded-md border border-border bg-popover p-3 shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(-1)}>
              ‹
            </Button>
            <p className="text-sm font-medium">{monthLabel}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(1)}>
              ›
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {getWeekdayLabels().map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-7 gap-1">
            {cells.map(({ date, inMonth }) => {
              const isSelected = isSameDay(date, selectedDate)
              const isDisabled = disablePastDates && isBeforeDay(date, today)

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(date)}
                  className={`h-8 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : inMonth
                        ? 'hover:bg-muted'
                        : 'text-muted-foreground/50 hover:bg-muted/50'
                  } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hour</p>
              <select
                value={hour12}
                onChange={(e) =>
                  updateParts({
                    hour: to24Hour(Number(e.target.value), period),
                  })
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
                value={selectedParts.minute}
                onChange={(e) => updateParts({ minute: Number(e.target.value) })}
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
                  updateParts({
                    hour: to24Hour(hour12, e.target.value as 'AM' | 'PM'),
                  })
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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
