import type { CalendarEvent } from '@/types/calendar'
import {
  getNthWeekdayOfMonth,
  getWeekDates,
  getWeekdayNumber,
  parseLocalDate,
} from '@/utils/dateUtils'

export function eventOccursOnDate (event: CalendarEvent, dateString: string): boolean {
  if (dateString < event.startDate) {
    return false
  }

  if (event.recurrence.recurrenceEndDate && dateString > event.recurrence.recurrenceEndDate) {
    return false
  }

  const recurrenceType = event.recurrence.type

  if (recurrenceType === 'none') {
    return occursOnNone(event, dateString)
  }
  if (recurrenceType === 'daily') {
    return occursOnDaily()
  }
  if (recurrenceType === 'weekly') {
    return occursOnWeekly(event, dateString)
  }
  if (recurrenceType === 'yearly') {
    return occursOnYearly(event, dateString)
  }
  if (recurrenceType === 'monthly-ordinal') {
    return occursOnMonthlyOrdinal(event, dateString)
  }

  return false
}

function occursOnNone (event: CalendarEvent, dateString: string): boolean {
  if (event.isAllDay && event.endDate) {
    return dateString <= event.endDate
  }
  return event.startDate === dateString
}

function occursOnDaily (): boolean {
  return true
}

function occursOnWeekly (event: CalendarEvent, dateString: string): boolean {
  const targetWeekday = event.recurrence.weekday ?? getWeekdayNumber(event.startDate)
  return getWeekdayNumber(dateString) === targetWeekday
}

function occursOnYearly (event: CalendarEvent, dateString: string): boolean {
  const eventMonthDay = event.startDate.slice(5)
  const checkMonthDay = dateString.slice(5)
  return eventMonthDay === checkMonthDay
}

function occursOnMonthlyOrdinal (event: CalendarEvent, dateString: string): boolean {
  const ordinalPosition = event.recurrence.ordinalPosition
  const ordinalWeekday = event.recurrence.ordinalWeekday

  if (ordinalPosition === undefined || ordinalWeekday === undefined) {
    return false
  }

  const checkDate = parseLocalDate(dateString)
  const year = checkDate.getFullYear()
  const month = checkDate.getMonth() + 1

  const occurrenceDate = getNthWeekdayOfMonth(year, month, ordinalWeekday, ordinalPosition)
  return occurrenceDate === dateString
}

export function getEventsForDate (
  allEvents: CalendarEvent[],
  dateString: string,
): CalendarEvent[] {
  return allEvents.filter(event => eventOccursOnDate(event, dateString))
}

export function getEventsForWeek (
  allEvents: CalendarEvent[],
  mondayDateString: string,
): Map<string, CalendarEvent[]> {
  const weekDates = getWeekDates(mondayDateString)
  const eventsByDate = new Map<string, CalendarEvent[]>()

  for (const dateString of weekDates) {
    eventsByDate.set(dateString, getEventsForDate(allEvents, dateString))
  }

  return eventsByDate
}
