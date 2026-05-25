import type { OrdinalPosition, WeekdayNumber } from '@/types/calendar'

export function today (): string {
  return formatDate(new Date())
}

export function formatDate (date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate (isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays (dateString: string, numberOfDays: number): string {
  const date = parseLocalDate(dateString)
  date.setDate(date.getDate() + numberOfDays)
  return formatDate(date)
}

export function getWeekdayNumber (dateString: string): WeekdayNumber {
  return parseLocalDate(dateString).getDay() as WeekdayNumber
}

export function startOfWeek (dateString: string): string {
  const date = parseLocalDate(dateString)
  const weekday = date.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  return addDays(dateString, mondayOffset)
}

export function getWeekDates (dateString: string): string[] {
  const monday = startOfWeek(dateString)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function getNthWeekdayOfMonth (
  year: number,
  month: number,
  targetWeekday: WeekdayNumber,
  position: OrdinalPosition,
): string {
  if (position === 'last') {
    return getLastWeekdayOfMonth(year, month, targetWeekday)
  }
  return getOrdinalWeekdayOfMonth(year, month, targetWeekday, position)
}

function getOrdinalWeekdayOfMonth (
  year: number,
  month: number,
  targetWeekday: WeekdayNumber,
  ordinal: 1 | 2 | 3 | 4,
): string {
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const firstWeekday = firstDayOfMonth.getDay()
  const daysUntilTarget = (targetWeekday - firstWeekday + 7) % 7
  const firstOccurrenceDay = 1 + daysUntilTarget
  const targetDay = firstOccurrenceDay + (ordinal - 1) * 7
  return formatDate(new Date(year, month - 1, targetDay))
}

function getLastWeekdayOfMonth (
  year: number,
  month: number,
  targetWeekday: WeekdayNumber,
): string {
  const lastDayOfMonth = new Date(year, month, 0)
  const lastWeekday = lastDayOfMonth.getDay()
  const daysBack = (lastWeekday - targetWeekday + 7) % 7
  const targetDay = lastDayOfMonth.getDate() - daysBack
  return formatDate(new Date(year, month - 1, targetDay))
}

export function isPastTime (dateString: string, timeString: string): boolean {
  const now = new Date()
  const [hours, minutes] = timeString.split(':').map(Number)
  const eventEnd = parseLocalDate(dateString)
  eventEnd.setHours(hours, minutes, 0, 0)
  return eventEnd < now
}

export function formatDisplayDate (dateString: string): string {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDisplayTime (timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function getDayName (dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, { weekday: 'short' })
}

export function getFullDayName (dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, { weekday: 'long' })
}

export function formatDisplayTimeWithFormat (timeString: string, use24Hour: boolean): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  if (use24Hour) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function getDayNumber (dateString: string): number {
  return parseLocalDate(dateString).getDate()
}

export function getMonthYear (dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function isSameDate (dateStringA: string, dateStringB: string): boolean {
  return dateStringA === dateStringB
}

export function addMonths (dateString: string, n: number): string {
  const date = parseLocalDate(dateString)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + n)
  // Clamp to last day of resulting month
  const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, maxDay))
  return formatDate(date)
}

export function getYear (dateString: string): number {
  return parseLocalDate(dateString).getFullYear()
}

export function getMonthName (dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, { month: 'long' })
}

export function formatDisplayDateLong (dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getISOWeekNumber (dateString: string): number {
  const date = parseLocalDate(dateString)
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + 4 - (date.getDay() || 7))
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  return Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export function startOfMonth (dateString: string): string {
  const date = parseLocalDate(dateString)
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonth (dateString: string): string {
  const date = parseLocalDate(dateString)
  return formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function getMonthGridDates (dateString: string): Array<{ date: string, isCurrentMonth: boolean }> {
  const date = parseLocalDate(dateString)
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstOfMonth = formatDate(new Date(year, month, 1))
  const firstMonday = startOfWeek(firstOfMonth)
  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = addDays(firstMonday, i)
    return {
      date: cellDate,
      isCurrentMonth: parseLocalDate(cellDate).getMonth() === month,
    }
  })
}
