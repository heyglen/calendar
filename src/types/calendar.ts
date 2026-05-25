export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'yearly' | 'monthly-ordinal'

export type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type OrdinalPosition = 1 | 2 | 3 | 4 | 'last'

export interface RecurrenceRule {
  type: RecurrenceType
  weekday?: WeekdayNumber
  ordinalPosition?: OrdinalPosition
  ordinalWeekday?: WeekdayNumber
  recurrenceEndDate?: string
}

export interface Person {
  id: string
  name: string
  color: string
  avatarBase64?: string
}

export interface EventSubTask {
  id: string
  icon: string
  iconLibrary: 'mdi' | 'fa'
  label: string
  dependsOn: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  icon: string
  iconLibrary: 'mdi' | 'fa'
  color: string
  startDate: string
  endDate?: string
  startTime: string
  endTime: string
  recurrence: RecurrenceRule
  isAllDay?: boolean
  showCountdown?: boolean
  personId?: string
  subtasks?: EventSubTask[]
  isPinned?: boolean
  hideFromMonthView?: boolean
  hasTimer?: boolean
}

export interface SleepTime {
  start: string | null
  end: string | null
}

export interface SleepSchedule {
  default: SleepTime
  weekdays: Partial<Record<WeekdayNumber, SleepTime>>
  overrides: Array<{ date: string } & SleepTime>
}

export interface AppPreferences {
  view: 'day' | 'week' | 'month' | 'year' | 'upnext'
  selectedDate: string
  showPastEvents: boolean
  use24HourClock: boolean
  sleepStart: string | null
  sleepEnd: string | null
  sleepSchedule: SleepSchedule | null
  people: Person[]
  activePersonFilter: string[] | null
  theme?: string
  showEventTitles?: boolean
}

export const PALETTE_COLORS = [
  '#e53935',
  '#e67e22',
  '#f1c40f',
  '#27ae60',
  '#16a085',
  '#2980b9',
  '#8e44ad',
  '#e91e8c',
  '#795548',
  '#546e7a',
  '#43a047',
  '#00838f',
] as const

export type PaletteColor = typeof PALETTE_COLORS[number]
