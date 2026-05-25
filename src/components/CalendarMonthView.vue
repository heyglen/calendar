<template>
  <div ref="monthViewRef" class="month-view" tabindex="0" @keydown="onKeyDown">
    <!-- Weekday headers: blank week-number cell + Mon–Sun -->
    <div class="month-view__weekday-headers">
      <div class="month-view__weeknum-header" />

      <div v-for="name in weekdayNames" :key="name" class="month-view__weekday-header">
        {{ name }}
      </div>
    </div>

    <!-- Grid: 6 weeks × (week-num cell + 7 day cells) -->
    <div class="month-view__grid-wrapper">
      <transition mode="out-in" :name="slideName">
        <div :key="monthKey" class="month-view__grid">
          <template v-for="week in monthWeeks" :key="week[0].date">
            <!-- Week number -->
            <div class="month-view__week-number">
              {{ getISOWeekNumber(week[0].date) }}
            </div>

            <!-- 7 day cells -->
            <div
              v-for="cell in week"
              :key="cell.date"
              class="month-view__cell"
              :class="{
                'month-view__cell--other-month': !cell.isCurrentMonth,
                'month-view__cell--today': isSameDate(cell.date, todayDate),
                'month-view__cell--selected': cell.date === selectedCell,
                'month-view__cell--no-events': cellAllEvents(cell.date).length === 0,
                'month-view__cell--has-events': cellAllEvents(cell.date).length > 0,
                'month-view__cell--drag-over': dragOverDate === cell.date,
              }"
              @click="navigateToDayView(cell.date)"
              @dragleave="onCellDragLeave($event, cell.date)"
              @dragover.prevent="dragOverDate = cell.date"
              @drop="onCellDrop($event, cell.date)"
            >
              <span
                class="month-view__cell-day"
                :class="{ 'month-view__cell-day--today': isSameDate(cell.date, todayDate) }"
              >
                {{ getDayNumber(cell.date) }}
              </span>

              <div v-if="cellAllEvents(cell.date).length > 0" class="month-view__cell-events">
                <div
                  v-for="event in cellEventsSlice(cell.date)"
                  :key="event.id"
                  class="month-view__event-pill"
                  :class="{
                    'month-view__event-pill--allday': event.isAllDay,
                    'month-view__event-pill--show-title': calendarStore.preferences.showEventTitles,
                    'month-view__event-pill--preview': event.isPreview,
                  }"
                  :draggable="!event.isPreview"
                  :style="{
                    backgroundColor: event.color,
                    '--pill-icon-size': `calc(${100 / cellEventsSlice(cell.date).length}cqh * 0.92)`,
                  }"
                  :title="event.title || undefined"
                  @click.stop="event.isPreview ? undefined : onEventClick(event, cell.date)"
                  @dragend="event.isPreview ? undefined : onPillDragEnd()"
                  @dragstart="event.isPreview ? undefined : onPillDragStart($event, event)"
                >
                  <v-icon
                    v-if="event.iconLibrary === 'mdi'"
                    class="month-view__event-icon"
                    color="white"
                    :icon="event.icon"
                  />

                  <i
                    v-else
                    :class="`fas fa-${event.icon.replace('fa-', '')} month-view__event-fa-icon`"
                  />

                  <span v-if="calendarStore.preferences.showEventTitles && event.title" class="month-view__event-title" :style="{ fontSize: monthTitleFontSize(event.title) }">{{ event.title }}</span>
                </div>

                <div v-if="cellEventOverflow(cell.date) > 0" class="month-view__overflow">
                  +{{ cellEventOverflow(cell.date) }} more
                </div>
              </div>
            </div>
          </template>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, onMounted, ref, watch } from 'vue'
  import { dragState } from '@/composables/useDragDrop'
  import { getEventsForDate } from '@/composables/useRecurrence'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { addDays, getDayNumber, getISOWeekNumber, getMonthGridDates, isSameDate, today } from '@/utils/dateUtils'

  function monthTitleFontSize (title: string): string {
    const len = title.length
    if (len <= 8) return '0.72rem'
    if (len <= 16) return '0.62rem'
    if (len <= 24) return '0.54rem'
    return '0.46rem'
  }

  const MAX_VISIBLE_EVENTS = 3

  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

  const todayDate = today()
  const monthViewRef = ref<HTMLElement | null>(null)
  const selectedCell = ref<string>(calendarStore.preferences.selectedDate)
  const dragOverDate = ref<string | null>(null)

  const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const slideName = computed(() =>
    appStore.navigationDirection === 'forward' ? 'slide-down' : 'slide-up',
  )

  const monthKey = computed(() =>
    calendarStore.preferences.selectedDate.slice(0, 7),
  )

  const monthGrid = computed(() =>
    getMonthGridDates(calendarStore.preferences.selectedDate),
  )

  const monthWeeks = computed(() =>
    Array.from({ length: 6 }, (_, w) => monthGrid.value.slice(w * 7, w * 7 + 7)),
  )

  const personFilter = computed(() => calendarStore.preferences.activePersonFilter)

  function cellAllEvents (dateString: string): CalendarEvent[] {
    const all = getEventsForDate(calendarStore.events, dateString)
    const filtered = personFilter.value
      ? all.filter(e => !e.personId || personFilter.value!.includes(e.personId))
      : all
    const visible = [
      ...filtered.filter(e => e.isAllDay && !e.hideFromMonthView),
      ...filtered.filter(e => !e.isAllDay && !e.hideFromMonthView),
    ]
    const preview = appStore.previewEvent
    if (preview && !preview.hideFromMonthView && preview.startDate === dateString) {
      visible.push(preview as unknown as CalendarEvent)
    }
    return visible
  }

  function cellEventsSlice (dateString: string): CalendarEvent[] {
    return cellAllEvents(dateString).slice(0, MAX_VISIBLE_EVENTS)
  }

  function cellEventOverflow (dateString: string): number {
    return Math.max(0, cellAllEvents(dateString).length - MAX_VISIBLE_EVENTS)
  }

  function navigateToDayView (dateString: string): void {
    calendarStore.viewPreferenceSetDate(dateString)
    calendarStore.viewPreferenceSetView('day')
  }

  function onEventClick (event: CalendarEvent, dateString: string): void {
    if (event.subtasks?.length) {
      appStore.taskViewOpen(event.id, dateString)
    } else {
      appStore.dialogEventOpen(event.id)
    }
  }

  function onPillDragStart (e: DragEvent, event: CalendarEvent): void {
    dragState.eventId = event.id
    dragState.grabOffsetMinutes = 0
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function onPillDragEnd (): void {
    dragState.eventId = null
    dragState.grabOffsetMinutes = 0
    dragOverDate.value = null
  }

  function onCellDragLeave (e: DragEvent, dateString: string): void {
    const related = e.relatedTarget as HTMLElement | null
    if ((!related || !(e.currentTarget as HTMLElement).contains(related)) && dragOverDate.value === dateString) dragOverDate.value = null
  }

  function onCellDrop (e: DragEvent, dateString: string): void {
    e.preventDefault()
    const eventId = dragState.eventId
    if (!eventId) return
    calendarStore.calendarEventUpdate(eventId, { startDate: dateString })
    dragOverDate.value = null
    dragState.eventId = null
    dragState.grabOffsetMinutes = 0
  }

  function onKeyDown (e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
    if (appStore.settingsDialogOpen) return

    const offsets: Partial<Record<string, number>> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }

    if (offsets[e.key] !== undefined) {
      e.preventDefault()
      const newCell = addDays(selectedCell.value, offsets[e.key]!)
      selectedCell.value = newCell
      const newMonth = newCell.slice(0, 7)
      const currentMonth = calendarStore.preferences.selectedDate.slice(0, 7)
      if (newMonth !== currentMonth) {
        appStore.setNavigationDirection(newMonth > currentMonth ? 'forward' : 'backward')
        calendarStore.viewPreferenceSetDate(newCell)
      }
      return
    }

    switch (e.key) {
      case 'Enter': {
        e.preventDefault()
        navigateToDayView(selectedCell.value)
        break
      }
      case 'Escape': {
        monthViewRef.value?.blur()
        break
      }
    }
  }

  watch(
    () => appStore.settingsDialogOpen,
    isOpen => {
      if (!isOpen) monthViewRef.value?.focus()
    },
  )

  onMounted(() => {
    monthViewRef.value?.focus()
  })
</script>

<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.month-view__weekday-headers {
  display: grid;
  grid-template-columns: 28px repeat(7, 1fr);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  background: var(--v-theme-surface);
}

.month-view__weeknum-header {
  /* empty spacer above week numbers */
}

.month-view__weekday-header {
  font-size: 0.65rem;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
  text-align: center;
  padding: 6px 4px;
}

.month-view__grid-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.month-view__grid {
  display: grid;
  grid-template-columns: 28px repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  position: absolute;
  inset: 0;
  overflow-y: auto;
}

.month-view__week-number {
  font-size: 0.6rem;
  color: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  user-select: none;
}

.month-view__cell {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 4px;
  min-height: 80px;
  cursor: pointer;
  transition: background-color 0.1s;
  overflow: hidden;
}

.month-view__cell:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.month-view__cell--other-month {
  opacity: 0.4;
}

.month-view__cell--today {
  background-color: rgba(62, 76, 94, 0.05);
}

.month-view__cell--drag-over {
  background-color: rgba(var(--v-theme-primary), 0.1);
  outline: 2px dashed rgba(var(--v-theme-primary), 0.5);
  outline-offset: -2px;
}

.month-view__cell--has-events {
  display: flex;
  flex-direction: column;
}

.month-view__cell--has-events .month-view__cell-day {
  width: 100%;
  min-height: 22px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.month-view__cell--has-events .month-view__cell-day--today {
  width: 22px;
  height: 22px;
  background-color: var(--v-theme-primary);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* When a cell has no events, center the day number to fill the space */
.month-view__cell--no-events {
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-view__cell--no-events .month-view__cell-day {
  font-size: 1.6rem;
  width: auto;
  height: auto;
  font-weight: 300;
  color: rgba(62, 76, 94, 0.55);
}

.month-view__cell--no-events .month-view__cell-day--today {
  font-size: 1.6rem;
  font-weight: 600;
  background-color: var(--v-theme-primary);
  color: white;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-view__cell-day {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.month-view__cell-day--today {
  background-color: var(--v-theme-primary);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
}

.month-view__cell-events {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1px;
  min-height: 0;
  container-type: size;
}

.month-view__event-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 1px 2px;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  flex: 1;
  min-height: 0;
  position: relative;
}

.month-view__event-pill--preview {
  opacity: 0.6;
  pointer-events: none;
  border: 1px dashed rgba(255,255,255,0.7);
}

.month-view__event-icon {
  font-size: var(--pill-icon-size, 16px) !important;
  width: var(--pill-icon-size, 16px) !important;
  height: var(--pill-icon-size, 16px) !important;
  flex-shrink: 0;
}

.month-view__event-fa-icon {
  font-size: var(--pill-icon-size, 16px) !important;
  color: white;
  flex-shrink: 0;
  line-height: 1;
}

.month-view__event-pill:hover {
  opacity: 0.85;
}

.month-view__event-pill:hover .month-view__event-title-hover {
  opacity: 1;
}

.month-view__event-pill--allday {
  border-radius: 2px;
}

.month-view__event-title {
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.month-view__overflow {
  font-size: 0.65rem;
  color: rgba(0, 0, 0, 0.45);
  padding-left: 2px;
  flex-shrink: 0;
}

.month-view__cell--selected {
  background-color: rgba(62, 76, 94, 0.06);
  outline: 2px solid rgba(62, 76, 94, 0.25);
  outline-offset: -2px;
}

.month-view:focus {
  outline: none;
}
</style>
