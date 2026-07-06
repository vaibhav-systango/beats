export type DateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export type CalendarCell = {
  date: Date
  inMonth: boolean
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS
}

export function parseDatetimeLocal(value: string): DateTimeParts | null {
  if (!value.includes('T')) {
    return null
  }

  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return {
    year,
    month: month - 1,
    day,
    hour: hour ?? 0,
    minute: minute ?? 0,
  }
}

export function toDatetimeLocal(parts: DateTimeParts): string {
  const month = String(parts.month + 1).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')
  const hour = String(parts.hour).padStart(2, '0')
  const minute = String(parts.minute).padStart(2, '0')

  return `${parts.year}-${month}-${day}T${hour}:${minute}`
}

export function getDefaultDateTimeParts(): DateTimeParts {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)

  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  }
}

export function formatDatetimeDisplay(value: string): string {
  const parts = parseDatetimeLocal(value)
  if (!parts) {
    return ''
  }

  const date = new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getCalendarCells(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const start = new Date(year, month, 1 - startOffset)
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    cells.push({
      date,
      inMonth: date.getMonth() === month,
    })
  }

  return cells
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function isBeforeDay(date: Date, minDate: Date): boolean {
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const normalizedMin = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
  return normalizedDate.getTime() < normalizedMin.getTime()
}

export function parseTimeValue(value: string): { hour: number; minute: number } | null {
  if (!value) {
    return null
  }

  const [hour, minute] = value.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }

  return { hour, minute }
}

export function toTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatTimeDisplay(value: string): string {
  const parts = parseTimeValue(value)
  if (!parts) {
    return ''
  }

  const date = new Date()
  date.setHours(parts.hour, parts.minute, 0, 0)
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function to12Hour(hour24: number): { hour: number; period: 'AM' | 'PM' } {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return { hour, period }
}

export function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12
  }
  return hour12 === 12 ? 12 : hour12 + 12
}
