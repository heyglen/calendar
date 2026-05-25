<template>
  <div ref="dayViewRef" class="day-view" tabindex="0" @keydown="onKeyDown">
    <transition mode="out-in" :name="slideName">
      <div :key="selectedDate" class="day-view__slide">
        <AllDayBannerRow :column-dates="[selectedDate]" :columns="[allDayEvents]" />

        <PinnedEventsStrip v-if="pinnedEvents.length > 0" :date="selectedDate" :events="pinnedEvents" />

        <TimeGrid
          :column-count="1"
          :column-dates="[selectedDate]"
          :event-columns="[timedEvents]"
          :selected-hour="appStore.selectedHour"
          :show-current-time-indicator="isToday"
          :sleep-end="sleepTimes.end"
          :sleep-start="sleepTimes.start"
          :use24-hour-clock="calendarStore.preferences.use24HourClock"
          @click:hour="onHourClick"
          @click:sleep="openSleepSettings"
        />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { getEventsForDate } from '@/composables/useRecurrence'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { addDays, isPastTime, isSameDate, today } from '@/utils/dateUtils'

  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

  const slideName = computed(() =>
    appStore.navigationDirection === 'forward' ? 'slide-left' : 'slide-right',
  )

  const dayViewRef = ref<HTMLElement | null>(null)

  const selectedDate = computed(() => calendarStore.preferences.selectedDate)
  const isToday = computed(() => isSameDate(selectedDate.value, today()))
  const sleepTimes = computed(() => calendarStore.getSleepTimesForDate(selectedDate.value))

  const personFilter = computed(() => calendarStore.preferences.activePersonFilter)

  const dayEvents = computed(() => {
    const all = getEventsForDate(calendarStore.events, selectedDate.value)
    if (!personFilter.value) return all
    return all.filter(e => !e.personId || personFilter.value!.includes(e.personId))
  })

  const allDayEvents = computed(() => dayEvents.value.filter(e => e.isAllDay))

  const pinnedEvents = computed(() => dayEvents.value.filter(e => !e.isAllDay && e.isPinned))

  const timedEvents = computed(() => {
    const timed = dayEvents.value.filter(e => !e.isAllDay && !e.isPinned)
    const filtered = calendarStore.preferences.showPastEvents || !isToday.value
      ? timed
      : timed.filter(event => !isPastTime(selectedDate.value, event.endTime))
    const preview = appStore.previewEvent
    if (preview && !preview.isAllDay && !preview.isPinned && preview.startDate === selectedDate.value) {
      return [...filtered, preview as unknown as import('@/types/calendar').CalendarEvent]
    }
    return filtered
  })

  function onHourClick ({ time }: { time: string, columnIndex: number }): void {
    appStore.dialogEventOpen(null, time)
  }

  function openSleepSettings (): void {
    appStore.settingsInitialTab = 'sleep'
    appStore.settingsDialogOpen = true
  }

  function parseSleepHour (time: string | null | undefined): number | null {
    return time ? Number.parseInt(time.split(':')[0], 10) : null
  }

  function isHourInSleep (hour: number): boolean {
    const s = parseSleepHour(sleepTimes.value.start)
    const e = parseSleepHour(sleepTimes.value.end)
    if (s === null || e === null) return false
    if (s < e) return hour >= s && hour < e
    return hour >= s || hour < e
  }

  function sleepSkip (raw: number, direction: -1 | 1): number {
    if (!isHourInSleep(raw)) return raw
    const s = parseSleepHour(sleepTimes.value.start)
    const e = parseSleepHour(sleepTimes.value.end)
    if (s === null || e === null) return raw
    return direction === -1 ? Math.max(0, s - 1) : e
  }

  function onKeyDown (e: KeyboardEvent): void {
    if (appStore.settingsDialogOpen) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      appStore.setSelectedHour(sleepSkip(Math.max(0, (appStore.selectedHour ?? 24) - 1), -1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      const defaultHour = new Date().getHours()
      appStore.setSelectedHour(sleepSkip(Math.min(23, (appStore.selectedHour ?? defaultHour - 1) + 1), 1))
    } else if (e.key === 'ArrowLeft' && appStore.selectedHour !== null && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      appStore.setNavigationDirection('backward')
      calendarStore.viewPreferenceSetDate(addDays(calendarStore.preferences.selectedDate, -1))
    } else if (e.key === 'ArrowRight' && appStore.selectedHour !== null && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      appStore.setNavigationDirection('forward')
      calendarStore.viewPreferenceSetDate(addDays(calendarStore.preferences.selectedDate, 1))
    } else if (e.key === 'Enter' && appStore.selectedHour !== null) {
      const hour = appStore.selectedHour
      const eventsAtHour = timedEvents.value.filter(ev =>
        Number.parseInt(ev.startTime.split(':')[0], 10) === hour,
      )
      if (eventsAtHour.length > 0) {
        appStore.dialogEventOpen(eventsAtHour[0].id)
      } else {
        appStore.dialogEventOpen(null, `${String(hour).padStart(2, '0')}:00`)
      }
    }
  }

  watch(
    () => appStore.dialogEventIsOpen,
    isOpen => {
      if (!isOpen) dayViewRef.value?.focus()
    },
  )

  watch(
    () => appStore.settingsDialogOpen,
    isOpen => {
      if (!isOpen) dayViewRef.value?.focus()
    },
  )

  onMounted(() => {
    dayViewRef.value?.focus()
  })
</script>

<style scoped>
.day-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  outline: none;
  position: relative;
}

.day-view__slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
