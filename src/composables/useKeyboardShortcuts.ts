import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useCalendarStore } from '@/stores/calendar'
import { addDays, addMonths, endOfMonth, startOfMonth, startOfWeek, today } from '@/utils/dateUtils'

export function useKeyboardShortcuts (onShowHelp: () => void): void {
  const router = useRouter()
  const route = useRoute()
  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

  function navigateToView (view: 'day' | 'week' | 'month' | 'year' | 'upnext'): void {
    calendarStore.viewPreferenceSetView(view)
    if (route.path !== '/') {
      router.push('/')
    }
  }

  function navigateAlt (direction: -1 | 1): void {
    const date = calendarStore.preferences.selectedDate
    switch (calendarStore.preferences.view) {
      case 'month': {
        calendarStore.viewPreferenceSetDate(addMonths(date, direction))
        break
      }
      case 'year': {
        calendarStore.viewPreferenceSetDate(addMonths(date, direction * 12))
        break
      }
      case 'week': {
        calendarStore.viewPreferenceSetDate(addDays(date, direction * 7))
        break
      }
      default: {
        calendarStore.viewPreferenceSetDate(addDays(date, direction))
      }
    }
  }

  function onAltViewSwitch (e: KeyboardEvent): void {
    const viewMap: Record<string, 'day' | 'week' | 'month' | 'year' | 'upnext'> = {
      1: 'upnext',
      2: 'day',
      3: 'week',
      4: 'month',
      5: 'year',
    }
    const view = viewMap[e.key]
    if (view) {
      e.preventDefault()
      navigateToView(view)
    }
  }

  const VIEW_CYCLE: Array<'upnext' | 'day' | 'week' | 'month' | 'year'> = ['upnext', 'day', 'week', 'month', 'year']

  let lastEscapeTime = 0

  function onKeyDown (e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
      return
    }
    if (appStore.dialogEventIsOpen && e.key !== 'Escape') {
      return
    }
    if (appStore.settingsDialogOpen && e.key !== 'Escape' && !(e.altKey && e.key === ',')) {
      return
    }

    if (e.altKey && e.key === 'F1') {
      e.preventDefault()
      onShowHelp()
      return
    }

    if (e.altKey && e.key === ',') {
      e.preventDefault()
      appStore.settingsDialogToggle()
      return
    }

    if (e.shiftKey && e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault()
      const cur = VIEW_CYCLE.indexOf(calendarStore.preferences.view)
      const next = e.key === 'ArrowRight'
        ? (cur + 1) % VIEW_CYCLE.length
        : (cur - 1 + VIEW_CYCLE.length) % VIEW_CYCLE.length
      navigateToView(VIEW_CYCLE[next])
      return
    }

    if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
      onAltViewSwitch(e)
      return
    }

    switch (e.key) {
      case 't': {
        calendarStore.viewPreferenceSetDate(today())
        break
      }
      case 'n': {
        if (route.path === '/') {
          appStore.dialogEventOpen(null)
        }
        break
      }
      case 'd': {
        navigateToView('day')
        break
      }
      case 'w': {
        navigateToView('week')
        break
      }
      case 'u': {
        navigateToView('upnext')
        break
      }
      case 'ArrowLeft': {
        if (route.path === '/') {
          e.preventDefault()
          if (e.shiftKey && calendarStore.preferences.view === 'year') {
            navigateToView('month')
          } else if (e.altKey || calendarStore.preferences.view === 'year') {
            navigateAlt(-1)
          } else {
            calendarStore.viewPreferenceSetDate(addDays(calendarStore.preferences.selectedDate, -1))
          }
        }
        break
      }
      case 'ArrowRight': {
        if (route.path === '/') {
          e.preventDefault()
          if (e.shiftKey && calendarStore.preferences.view === 'year') {
            navigateToView('upnext')
          } else if (e.altKey || calendarStore.preferences.view === 'year') {
            navigateAlt(1)
          } else {
            calendarStore.viewPreferenceSetDate(addDays(calendarStore.preferences.selectedDate, 1))
          }
        }
        break
      }
      case 'Home': {
        e.preventDefault()
        const view = calendarStore.preferences.view
        const date = calendarStore.preferences.selectedDate
        switch (view) {
          case 'month': {
            calendarStore.viewPreferenceSetDate(startOfMonth(date))

            break
          }
          case 'week': {
            const monday = startOfWeek(date)
            calendarStore.viewPreferenceSetDate(monday)
            appStore.setSelectedWeekColumn(0)
            const sleepTimes = calendarStore.getSleepTimesForDate(monday)
            const wakeHour = sleepTimes.end ? Number.parseInt(sleepTimes.end.split(':')[0], 10) : 7
            appStore.setSelectedHour(wakeHour)

            break
          }
          case 'day': {
            const sleepTimes = calendarStore.getSleepTimesForDate(date)
            const wakeHour = sleepTimes.end ? Number.parseInt(sleepTimes.end.split(':')[0], 10) : 7
            appStore.setSelectedHour(wakeHour)

            break
          }
        // No default
        }
        break
      }
      case 'End': {
        e.preventDefault()
        const view = calendarStore.preferences.view
        const date = calendarStore.preferences.selectedDate
        switch (view) {
          case 'month': {
            calendarStore.viewPreferenceSetDate(endOfMonth(date))

            break
          }
          case 'week': {
            const sunday = addDays(startOfWeek(date), 6)
            calendarStore.viewPreferenceSetDate(sunday)
            appStore.setSelectedWeekColumn(6)
            const sleepTimes = calendarStore.getSleepTimesForDate(sunday)
            const bedtimeHour = sleepTimes.start ? Number.parseInt(sleepTimes.start.split(':')[0], 10) - 1 : 19
            appStore.setSelectedHour(Math.max(0, bedtimeHour))

            break
          }
          case 'day': {
            const sleepTimes = calendarStore.getSleepTimesForDate(date)
            const bedtimeHour = sleepTimes.start ? Number.parseInt(sleepTimes.start.split(':')[0], 10) - 1 : 19
            appStore.setSelectedHour(Math.max(0, bedtimeHour))

            break
          }
        // No default
        }
        break
      }
      case 'PageUp': {
        e.preventDefault()
        navigateAlt(-1)
        break
      }
      case 'PageDown': {
        e.preventDefault()
        navigateAlt(1)
        break
      }
      case '?': {
        onShowHelp()
        break
      }
      case 's': {
        appStore.settingsDialogToggle()
        break
      }
      case 'Escape': {
        if (appStore.dialogEventIsOpen) {
          appStore.dialogEventClose()
        } else if (appStore.settingsDialogOpen) {
          appStore.settingsDialogOpen = false
        } else {
          const now = Date.now()
          if (now - lastEscapeTime < 400) {
            calendarStore.viewPreferenceSetDate(today())
            lastEscapeTime = 0
          } else {
            lastEscapeTime = now
          }
        }
        break
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
