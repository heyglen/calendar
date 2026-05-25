import type { AppPreferences, CalendarEvent, Person, SleepSchedule, SleepTime, WeekdayNumber } from '@/types/calendar'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getWeekdayNumber, today } from '@/utils/dateUtils'

const STORAGE_KEY_EVENTS = 'calendar.events'
const STORAGE_KEY_PREFERENCES = 'calendar.preferences'

function seedDefaultEvents (): CalendarEvent[] {
  const schoolColor = '#2980b9'
  const candyColor = '#e91e8c'
  const schoolEnd = '2026-06-26'

  const weekdays: Array<{ id: string, date: string, day: WeekdayNumber }> = [
    { id: 'seed-school-mon-0001', date: '2025-08-11', day: 1 },
    { id: 'seed-school-tue-0002', date: '2025-08-12', day: 2 },
    { id: 'seed-school-wed-0003', date: '2025-08-13', day: 3 },
    { id: 'seed-school-thu-0004', date: '2025-08-14', day: 4 },
    { id: 'seed-school-fri-0005', date: '2025-08-15', day: 5 },
  ]

  const schoolEvents: CalendarEvent[] = weekdays.map(({ id, date, day }) => ({
    id,
    title: 'School',
    icon: 'fa-school',
    iconLibrary: 'fa' as const,
    color: schoolColor,
    startDate: date,
    startTime: '08:00',
    endTime: '14:00',
    recurrence: { type: 'weekly', weekday: day, recurrenceEndDate: schoolEnd },
    isPinned: true,
  }))

  const candyEvent: CalendarEvent = {
    id: 'seed-candy-fri-0006',
    title: 'Candy',
    icon: 'mdi-candy',
    iconLibrary: 'mdi',
    color: candyColor,
    startDate: '2025-08-15',
    startTime: '17:00',
    endTime: '18:00',
    recurrence: { type: 'weekly', weekday: 5 },
  }

  return [...schoolEvents, candyEvent]
}

function loadEventsFromStorage (): CalendarEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EVENTS)
    const parsed: CalendarEvent[] = stored ? JSON.parse(stored) : []
    if (parsed.length === 0) {
      const seeded = seedDefaultEvents()
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(seeded))
      return seeded
    }
    return parsed
  } catch {
    return seedDefaultEvents()
  }
}

function loadPreferencesFromStorage (): AppPreferences {
  const defaults: AppPreferences = {
    view: 'upnext',
    selectedDate: today(),
    showPastEvents: false,
    use24HourClock: true,
    sleepStart: '19:00',
    sleepEnd: '07:00',
    sleepSchedule: {
      default: { start: '19:00', end: '07:00' },
      weekdays: {},
      overrides: [],
    },
    people: [],
    activePersonFilter: null,
    theme: 'system',
    showEventTitles: false,
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFERENCES)
    const prefs: AppPreferences = stored ? { ...defaults, ...JSON.parse(stored) } : defaults
    if (!prefs.sleepSchedule && (prefs.sleepStart || prefs.sleepEnd)) {
      prefs.sleepSchedule = {
        default: { start: prefs.sleepStart, end: prefs.sleepEnd },
        weekdays: {},
        overrides: [],
      }
    }
    return prefs
  } catch {
    return defaults
  }
}

function saveEventsToStorage (events: CalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events))
}

function savePreferencesToStorage (preferences: AppPreferences): void {
  localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(preferences))
}

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>(loadEventsFromStorage())
  const preferences = ref<AppPreferences>(loadPreferencesFromStorage())

  watch(events, saveEventsToStorage, { deep: true })
  watch(preferences, savePreferencesToStorage, { deep: true })

  function calendarEventCreate (draft: Omit<CalendarEvent, 'id'>): void {
    const newEvent: CalendarEvent = {
      ...draft,
      id: crypto.randomUUID(),
    }
    events.value.push(newEvent)
  }

  function calendarEventUpdate (id: string, changes: Partial<CalendarEvent>): void {
    const eventIndex = events.value.findIndex(event => event.id === id)
    if (eventIndex === -1) {
      return
    }
    events.value[eventIndex] = { ...events.value[eventIndex], ...changes }
  }

  function calendarEventRemove (id: string): void {
    events.value = events.value.filter(event => event.id !== id)
  }

  function calendarEventFindById (id: string): CalendarEvent | undefined {
    return events.value.find(event => event.id === id)
  }

  function viewPreferenceSetView (view: AppPreferences['view']): void {
    preferences.value.view = view
  }

  function viewPreferenceSetDate (dateString: string): void {
    preferences.value.selectedDate = dateString
  }

  function viewPreferenceTogglePastEvents (): void {
    preferences.value.showPastEvents = !preferences.value.showPastEvents
  }

  function preferencesSetUse24HourClock (value: boolean): void {
    preferences.value.use24HourClock = value
  }

  function preferencesSetSleepStart (value: string | null): void {
    preferences.value.sleepStart = value
  }

  function preferencesSetSleepEnd (value: string | null): void {
    preferences.value.sleepEnd = value
  }

  function preferencesSetSleepSchedule (schedule: SleepSchedule | null): void {
    preferences.value.sleepSchedule = schedule
    if (schedule) {
      preferences.value.sleepStart = schedule.default.start
      preferences.value.sleepEnd = schedule.default.end
    } else {
      preferences.value.sleepStart = null
      preferences.value.sleepEnd = null
    }
  }

  function preferencesSetTheme (theme: string): void {
    preferences.value.theme = theme
  }

  function preferencesSetShowEventTitles (value: boolean): void {
    preferences.value.showEventTitles = value
  }

  function getSleepTimesForDate (dateString: string): SleepTime {
    const schedule = preferences.value.sleepSchedule
    if (!schedule) {
      return { start: preferences.value.sleepStart, end: preferences.value.sleepEnd }
    }
    const override = schedule.overrides.find(o => o.date === dateString)
    if (override) {
      return { start: override.start, end: override.end }
    }
    const weekday = getWeekdayNumber(dateString)
    const weekdayConfig = schedule.weekdays[weekday]
    if (weekdayConfig) {
      return weekdayConfig
    }
    return schedule.default
  }

  function importData (newEvents: CalendarEvent[], newPreferences?: Partial<AppPreferences>): void {
    events.value = newEvents
    if (newPreferences) {
      preferences.value = { ...preferences.value, ...newPreferences }
    }
  }

  function clearAllData (): void {
    events.value = []
    preferences.value = {
      view: 'upnext',
      selectedDate: today(),
      showPastEvents: false,
      use24HourClock: true,
      sleepStart: '19:00',
      sleepEnd: '07:00',
      sleepSchedule: {
        default: { start: '19:00', end: '07:00' },
        weekdays: {},
        overrides: [],
      },
      people: [],
      activePersonFilter: null,
      theme: 'system',
      showEventTitles: false,
    }
  }

  function personCreate (draft: Omit<Person, 'id'>): void {
    preferences.value.people = [
      ...preferences.value.people,
      { ...draft, id: crypto.randomUUID() },
    ]
  }

  function personUpdate (id: string, changes: Partial<Person>): void {
    preferences.value.people = preferences.value.people.map(p =>
      p.id === id ? { ...p, ...changes } : p,
    )
  }

  function personRemove (id: string): void {
    preferences.value.people = preferences.value.people.filter(p => p.id !== id)
    if (preferences.value.activePersonFilter) {
      const updated = preferences.value.activePersonFilter.filter(pid => pid !== id)
      preferences.value.activePersonFilter = updated.length > 0 ? updated : null
    }
  }

  function personFilterSet (ids: string[] | null): void {
    preferences.value.activePersonFilter = ids
  }

  function personFilterToggle (id: string): void {
    const current = preferences.value.activePersonFilter
    if (current === null) {
      preferences.value.activePersonFilter = [id]
    } else if (current.includes(id)) {
      const updated = current.filter(pid => pid !== id)
      preferences.value.activePersonFilter = updated.length > 0 ? updated : null
    } else {
      preferences.value.activePersonFilter = [...current, id]
    }
  }

  return {
    events,
    preferences,
    calendarEventCreate,
    calendarEventUpdate,
    calendarEventRemove,
    calendarEventFindById,
    viewPreferenceSetView,
    viewPreferenceSetDate,
    viewPreferenceTogglePastEvents,
    preferencesSetUse24HourClock,
    preferencesSetSleepStart,
    preferencesSetSleepEnd,
    preferencesSetSleepSchedule,
    preferencesSetTheme,
    preferencesSetShowEventTitles,
    getSleepTimesForDate,
    importData,
    clearAllData,
    personCreate,
    personUpdate,
    personRemove,
    personFilterSet,
    personFilterToggle,
  }
})
