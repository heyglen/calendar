<template>
  <div ref="weekViewRef" class="week-view" tabindex="0" @keydown="onKeyDown">
    <div class="week-view__header">
      <div class="week-view__time-spacer" />

      <div
        v-for="(dateString, colIndex) in weekDates"
        :key="dateString"
        class="week-view__day-header"
        :class="{
          'week-view__day-header--today': isSameDate(dateString, todayDate),
          'week-view__day-header--selected': appStore.selectedWeekColumn === colIndex,
        }"
      >
        <span class="week-view__day-name">{{ getFullDayName(dateString) }}</span>

        <span
          class="week-view__day-number"
          :class="{ 'week-view__day-number--today': isSameDate(dateString, todayDate) }"
        >
          {{ getDayNumber(dateString) }}
        </span>
      </div>
    </div>

    <div class="week-view__content-wrapper">
      <transition mode="out-in" :name="slideName">
        <div :key="weekDates[0]" class="week-view__slide">
          <AllDayBannerRow :column-dates="weekDates" :columns="allDayColumns" />

          <TimeGrid
            :column-count="7"
            :column-dates="weekDates"
            :event-columns="timedColumns"
            :max-events-per-slot="3"
            :selected-column="appStore.selectedWeekColumn"
            :selected-hour="appStore.selectedHour"
            :show-current-time-indicator="true"
            :sleep-end="weekSleepTimes.end"
            :sleep-start="weekSleepTimes.start"
            :use24-hour-clock="calendarStore.preferences.use24HourClock"
            @click:hour="onHourClick"
            @click:sleep="openSleepSettings"
            @overflow-click="onOverflowClick"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { getEventsForWeek } from '@/composables/useRecurrence'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { addDays, getDayNumber, getFullDayName, getWeekDates, isPastTime, isSameDate, startOfWeek, today } from '@/utils/dateUtils'

  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

  const weekViewRef = ref<HTMLElement | null>(null)
  const todayDate = today()

  const slideName = computed(() =>
    appStore.navigationDirection === 'forward' ? 'slide-left' : 'slide-right',
  )

  const weekDates = computed(() =>
    getWeekDates(startOfWeek(calendarStore.preferences.selectedDate)),
  )

  const personFilter = computed(() => calendarStore.preferences.activePersonFilter)

  const eventColumns = computed(() => {
    const monday = weekDates.value[0]
    const eventsMap = getEventsForWeek(calendarStore.events, monday)
    return weekDates.value.map(dateString => {
      const all = eventsMap.get(dateString) ?? []
      if (!personFilter.value) return all
      return all.filter(e => !e.personId || personFilter.value!.includes(e.personId))
    })
  })

  const weekSleepTimes = computed(() => {
    const s = calendarStore.preferences.sleepSchedule
    return s?.default ?? { start: calendarStore.preferences.sleepStart, end: calendarStore.preferences.sleepEnd }
  })

  const allDayColumns = computed(() => eventColumns.value.map(col => col.filter(e => e.isAllDay)))
  const timedColumns = computed(() =>
    eventColumns.value.map((col, i) => {
      const timed = col.filter(e => !e.isAllDay)
      const filtered = calendarStore.preferences.showPastEvents || !isSameDate(weekDates.value[i], todayDate)
        ? timed
        : timed.filter(e => !isPastTime(weekDates.value[i], e.endTime))
      const preview = appStore.previewEvent
      if (preview && !preview.isAllDay && !preview.isPinned && preview.startDate === weekDates.value[i]) {
        return [...filtered, preview as unknown as import('@/types/calendar').CalendarEvent]
      }
      return filtered
    }),
  )

  function todayColumnIndex (): number {
    const idx = weekDates.value.findIndex(d => isSameDate(d, todayDate))
    return Math.max(idx, 0)
  }

  function onHourClick ({ time, columnIndex }: { time: string, columnIndex: number }): void {
    const dateString = weekDates.value[columnIndex]
    appStore.setSelectedWeekColumn(columnIndex)
    calendarStore.viewPreferenceSetDate(dateString)
    appStore.dialogEventOpen(null, time)
  }

  function openSleepSettings (): void {
    appStore.settingsInitialTab = 'sleep'
    appStore.settingsDialogOpen = true
  }

  function onOverflowClick ({ date }: { date: string | undefined, columnIndex: number }): void {
    if (date) calendarStore.viewPreferenceSetDate(date)
    calendarStore.viewPreferenceSetView('day')
  }

  function parseSleepHour (time: string | null | undefined): number | null {
    return time ? Number.parseInt(time.split(':')[0], 10) : null
  }

  function isHourInSleep (hour: number): boolean {
    const s = parseSleepHour(weekSleepTimes.value.start)
    const e = parseSleepHour(weekSleepTimes.value.end)
    if (s === null || e === null) return false
    if (s < e) return hour >= s && hour < e
    return hour >= s || hour < e
  }

  function sleepSkip (raw: number, direction: -1 | 1): number {
    if (!isHourInSleep(raw)) return raw
    const s = parseSleepHour(weekSleepTimes.value.start)
    const e = parseSleepHour(weekSleepTimes.value.end)
    if (s === null || e === null) return raw
    return direction === -1 ? Math.max(0, s - 1) : e
  }

  function onKeyDown (e: KeyboardEvent): void {
    if (appStore.settingsDialogOpen) return
    const col = appStore.selectedWeekColumn ?? 0
    const hour = appStore.selectedHour ?? new Date().getHours()

    if (e.key === 'ArrowLeft' && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      appStore.setNavigationDirection('backward')
      if (col > 0) {
        const newCol = col - 1
        appStore.setSelectedWeekColumn(newCol)
        calendarStore.viewPreferenceSetDate(weekDates.value[newCol])
      } else {
        // Wrap to previous week's Sunday
        const prevSunday = addDays(weekDates.value[0], -1)
        calendarStore.viewPreferenceSetDate(prevSunday)
        appStore.setSelectedWeekColumn(6)
      }
    } else if (e.key === 'ArrowRight' && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      appStore.setNavigationDirection('forward')
      if (col < 6) {
        const newCol = col + 1
        appStore.setSelectedWeekColumn(newCol)
        calendarStore.viewPreferenceSetDate(weekDates.value[newCol])
      } else {
        // Wrap to next week's Monday
        const nextMonday = addDays(weekDates.value[6], 1)
        calendarStore.viewPreferenceSetDate(nextMonday)
        appStore.setSelectedWeekColumn(0)
      }
    } else switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        e.stopPropagation()
        appStore.setSelectedHour(sleepSkip(Math.max(0, hour - 1), -1))

        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        e.stopPropagation()
        appStore.setSelectedHour(sleepSkip(Math.min(23, hour + 1), 1))

        break
      }
      case 'Enter': {
        e.preventDefault()
        e.stopPropagation()
        const dateString = weekDates.value[col]
        const eventsAtHour = timedColumns.value[col].filter(ev =>
          Number.parseInt(ev.startTime.split(':')[0], 10) === hour,
        )
        calendarStore.viewPreferenceSetDate(dateString)
        if (eventsAtHour.length > 0) {
          appStore.dialogEventOpen(eventsAtHour[0].id)
        } else {
          appStore.dialogEventOpen(null, `${String(hour).padStart(2, '0')}:00`)
        }

        break
      }
      // No default
    }
  }

  watch(
    () => appStore.dialogEventIsOpen,
    isOpen => {
      if (!isOpen) weekViewRef.value?.focus()
    },
  )

  watch(
    () => appStore.settingsDialogOpen,
    isOpen => {
      if (!isOpen) weekViewRef.value?.focus()
    },
  )

  onMounted(() => {
    weekViewRef.value?.focus()
    // Initialise selection: today's column if visible, otherwise column of selectedDate
    const todayIdx = weekDates.value.findIndex(d => isSameDate(d, todayDate))
    if (appStore.selectedWeekColumn === null) {
      appStore.setSelectedWeekColumn(todayIdx === -1 ? todayColumnIndex() : todayIdx)
      appStore.setSelectedHour(new Date().getHours())
    }
  })
</script>

<style scoped>
.week-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  outline: none;
}

.week-view__content-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.week-view__slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.week-view__header {
  display: flex;
  align-items: center;
  padding: 6px 0 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  background: var(--v-theme-surface);
  position: sticky;
  top: 0;
  z-index: 5;
}

.week-view__time-spacer {
  width: 56px;
  flex-shrink: 0;
}

.week-view__day-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  border-radius: 6px;
  padding: 2px 0;
  transition: background-color 0.1s;
}

.week-view__day-header--selected {
  background-color: rgba(62, 76, 94, 0.08);
}

.week-view__day-name {
  font-size: 0.65rem;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.week-view__day-number {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
}

.week-view__day-number--today {
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.week-view__day-header--today {
  background-color: rgba(62, 76, 94, 0.1);
  border-radius: 6px;
}
</style>
