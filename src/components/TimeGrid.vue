<template>
  <div ref="gridWrapper" class="time-grid-wrapper">
    <div
      class="time-grid"
      :style="gridStyle"
      @mouseleave="hoveredHour = null; hoveredColumn = null"
    >
      <!-- Hour labels column -->
      <div
        v-for="hour in DISPLAY_HOURS"
        :key="`label-${hour}`"
        class="time-grid__hour-label"
        :style="hourLabelStyle(hour)"
      >
        <template v-if="!isInSleepRange(hour)">{{ formatHour(hour) }}</template>
      </div>

      <!-- Hour divider lines across all columns (hidden in sleep range) -->
      <template v-for="hour in DISPLAY_HOURS" :key="`divider-${hour}`">
        <div
          v-if="!isInSleepRange(hour)"
          class="time-grid__divider"
          :style="dividerStyle(hour)"
        />
      </template>

      <!-- Column separators only for non-sleep rows (hides borders in sleep area) -->
      <template v-for="({ col, hour }, i) in colSeparators" :key="`cs-${i}`">
        <div
          class="time-grid__col-separator"
          :style="{ gridColumn: col + 2, gridRow: hour + 1 }"
        />
      </template>

      <!-- Keyboard selection highlight -->
      <div
        v-if="props.selectedHour !== null && props.selectedHour !== undefined"
        class="time-grid__hour-highlight"
        :style="{
          gridColumn: props.selectedColumn !== null && props.selectedColumn !== undefined
            ? String(props.selectedColumn + 2)
            : `2 / span ${props.columnCount}`,
          gridRow: String((props.selectedHour ?? 0) + 1),
        }"
      />

      <!-- Sleep spanning background blocks (one or two for cross-midnight) -->
      <div
        v-for="(block, idx) in sleepBlocks"
        :key="`sleep-block-${idx}`"
        class="time-grid__sleep-block"
        :style="{
          gridColumn: `2 / span ${props.columnCount}`,
          gridRow: `${block.startRow} / span ${block.spanCount}`,
        }"
        @click.stop="emit('click:sleep')"
      />

      <!-- Sleep boundary icons -->
      <template v-if="sleepStartHour !== null && sleepEndHour !== null">
        <div
          class="time-grid__sleep-icon"
          :style="sleepStartIconStyle"
        >
          <v-icon icon="mdi-sleep" size="32" />
        </div>

        <div
          v-if="Object.keys(sleepEndIconStyle).length > 0"
          class="time-grid__sleep-icon"
          :style="sleepEndIconStyle"
        >
          <v-icon icon="mdi-sleep" size="32" />
        </div>
      </template>

      <!-- Day columns with events -->
      <div
        v-for="(columnEvents, columnIndex) in eventColumns"
        :key="`column-${columnIndex}`"
        class="time-grid__day-column"
        :style="dayColumnStyle(columnIndex)"
        @click="onDayColumnClick($event, columnIndex)"
        @dragleave="onDragLeave($event)"
        @dragover.prevent="onDragOver($event, columnIndex)"
        @drop="onDrop($event, columnIndex)"
        @mousemove="onDayColumnMouseMove($event, columnIndex)"
      >
        <template v-for="(eventGroup, hour) in groupedByHour(columnEvents)" :key="hour">
          <EventBlock
            v-for="(event, indexInGroup) in visibleEventsInGroup(eventGroup)"
            :key="event.id"
            :column="indexInGroup"
            :date="props.columnDates?.[columnIndex]"
            :event="event"
            :style="eventPositionStyle(Number(hour))"
            :total-columns="slotColumnCount(eventGroup)"
          />

          <div
            v-if="props.maxEventsPerSlot && eventGroup.length > props.maxEventsPerSlot"
            class="time-grid__overflow-btn"
            :style="overflowBtnStyle(Number(hour))"
            @click.stop="emit('overflow-click', { date: props.columnDates?.[columnIndex], columnIndex })"
          >
            …
          </div>
        </template>

        <!-- Add-event button (hover with debounce OR keyboard selection) -->
        <transition name="add-btn">
          <button
            v-if="(showAddBtn && hoveredColumn === columnIndex && hoveredHour !== null && !isInSleepRange(hoveredHour)) || (props.selectedHour !== null && props.selectedHour !== undefined && !isInSleepRange(props.selectedHour) && hoveredHour === null && (props.selectedColumn === columnIndex || (props.selectedColumn === null && columnIndex === 0)))"
            class="time-grid__add-event-btn"
            :style="{ top: (getHourTop(showAddBtn && hoveredColumn === columnIndex && hoveredHour !== null ? hoveredHour : (props.selectedHour ?? 0)) + 4) + 'px' }"
            type="button"
            @click.stop="emit('click:hour', { time: `${String(showAddBtn && hoveredColumn === columnIndex && hoveredHour !== null ? hoveredHour : (props.selectedHour ?? 0)).padStart(2, '0')}:00`, columnIndex })"
          >
            <v-icon color="white" icon="mdi-plus" size="16" />
          </button>
        </transition>

        <!-- Current time indicator (inside column so position:absolute works reliably) -->
        <div
          v-if="showNowLineForColumn(columnIndex)"
          class="time-grid__current-time"
          :style="{ top: currentTimeTopPx + 'px' }"
        />

        <!-- Drop indicator line -->
        <div
          v-if="dragState.eventId && dropTargetColumn === columnIndex && dropIndicatorTop !== null"
          class="time-grid__drop-indicator"
          :style="{ top: dropIndicatorTop + 'px' }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, onMounted, ref, watch } from 'vue'
  import { dragState } from '@/composables/useDragDrop'
  import { HOUR_HEIGHT_NORMAL, HOUR_HEIGHT_SLEEP } from '@/constants'
  import { useCalendarStore } from '@/stores/calendar'
  import { isSameDate, today } from '@/utils/dateUtils'

  const DISPLAY_HOURS = Array.from({ length: 24 }, (_, index) => index)

  const props = defineProps<{
    eventColumns: CalendarEvent[][]
    columnCount: number
    columnDates?: string[]
    showCurrentTimeIndicator?: boolean
    use24HourClock?: boolean
    sleepStart?: string | null
    sleepEnd?: string | null
    selectedHour?: number | null
    selectedColumn?: number | null
    maxEventsPerSlot?: number
  }>()

  const emit = defineEmits<{
    'click:hour': [payload: { time: string, columnIndex: number }]
    'overflow-click': [payload: { date: string | undefined, columnIndex: number }]
    'click:sleep': []
  }>()

  const calendarStore = useCalendarStore()
  const gridWrapper = ref<HTMLElement | null>(null)
  const hoveredHour = ref<number | null>(null)
  const hoveredColumn = ref<number | null>(null)
  const dropTargetMinutes = ref<number | null>(null)
  const dropTargetColumn = ref<number | null>(null)
  const showAddBtn = ref(false)
  let showAddBtnTimer: ReturnType<typeof setTimeout> | null = null

  watch([hoveredHour, hoveredColumn], ([hour, col]) => {
    if (showAddBtnTimer !== null) {
      clearTimeout(showAddBtnTimer)
      showAddBtnTimer = null
    }
    showAddBtn.value = false
    if (hour !== null && col !== null && !isInSleepRange(hour)) {
      showAddBtnTimer = setTimeout(() => {
        showAddBtn.value = true
      }, 350)
    }
  })

  const sleepStartHour = computed<number | null>(() => {
    if (!props.sleepStart) return null
    return Number.parseInt(props.sleepStart.split(':')[0], 10)
  })

  const sleepEndHour = computed<number | null>(() => {
    if (!props.sleepEnd) return null
    return Number.parseInt(props.sleepEnd.split(':')[0], 10)
  })

  interface SleepBlock { startRow: number, spanCount: number }

  const sleepBlocks = computed<SleepBlock[]>(() => {
    const s = sleepStartHour.value
    const e = sleepEndHour.value
    if (s === null || e === null) return []
    if (s < e) {
      return [{ startRow: s + 1, spanCount: e - s }]
    }
    // Cross-midnight: two blocks (morning 0..e-1, evening s..23)
    const blocks: SleepBlock[] = []
    if (e > 0) blocks.push({ startRow: 1, spanCount: e })
    if (s < 24) blocks.push({ startRow: s + 1, spanCount: 24 - s })
    return blocks
  })

  function isInSleepRange (hour: number): boolean {
    const s = sleepStartHour.value
    const e = sleepEndHour.value
    if (s === null || e === null) return false
    if (s < e) return hour >= s && hour < e
    return hour >= s || hour < e
  }

  // Column separators only for non-sleep rows (removes borders in sleep area)
  const colSeparators = computed(() => {
    if (props.columnCount <= 1) return []
    const seps: Array<{ col: number, hour: number }> = []
    for (let col = 0; col < props.columnCount - 1; col++) {
      for (const hour of DISPLAY_HOURS) {
        if (!isInSleepRange(hour)) {
          seps.push({ col, hour })
        }
      }
    }
    return seps
  })

  function heightForHour (hour: number): number {
    return isInSleepRange(hour) ? HOUR_HEIGHT_SLEEP : HOUR_HEIGHT_NORMAL
  }

  function getHourTop (targetHour: number): number {
    return DISPLAY_HOURS.slice(0, targetHour).reduce((sum, h) => sum + heightForHour(h), 0)
  }

  const totalGridHeight = computed(() =>
    DISPLAY_HOURS.reduce((sum, h) => sum + heightForHour(h), 0),
  )

  const gridStyle = computed(() => ({
    gridTemplateColumns: `56px repeat(${props.columnCount}, 1fr)`,
    gridTemplateRows: DISPLAY_HOURS.map(h => `${heightForHour(h)}px`).join(' '),
  }))

  function hourLabelStyle (hour: number) {
    return {
      gridColumn: '1',
      gridRow: `${hour + 1}`,
      alignSelf: 'start',
    }
  }

  function dividerStyle (hour: number) {
    return {
      gridColumn: `2 / span ${props.columnCount}`,
      gridRow: `${hour + 1}`,
    }
  }

  function dayColumnStyle (columnIndex: number) {
    return {
      gridColumn: `${columnIndex + 2}`,
      gridRow: `1 / span 24`,
      height: `${totalGridHeight.value}px`,
    }
  }

  function eventPositionStyle (hourStart: number) {
    return {
      top: `${getHourTop(hourStart)}px`,
      height: `${HOUR_HEIGHT_NORMAL}px`,
      position: 'absolute' as const,
    }
  }

  function groupedByHour (columnEvents: CalendarEvent[]): Record<number, CalendarEvent[]> {
    const groups: Record<number, CalendarEvent[]> = {}
    for (const event of columnEvents) {
      const startHour = Number.parseInt(event.startTime.split(':')[0], 10)
      if (!groups[startHour]) groups[startHour] = []
      groups[startHour].push(event)
    }
    return groups
  }

  function visibleEventsInGroup (eventGroup: CalendarEvent[]): CalendarEvent[] {
    if (!props.maxEventsPerSlot) return eventGroup
    return eventGroup.slice(0, props.maxEventsPerSlot)
  }

  function slotColumnCount (eventGroup: CalendarEvent[]): number {
    if (!props.maxEventsPerSlot || eventGroup.length <= props.maxEventsPerSlot) {
      return eventGroup.length
    }
    return props.maxEventsPerSlot + 1
  }

  function overflowBtnStyle (hourStart: number) {
    const total = props.maxEventsPerSlot! + 1
    const col = props.maxEventsPerSlot!
    return {
      top: `${getHourTop(hourStart) + 4}px`,
      height: `${HOUR_HEIGHT_NORMAL - 8}px`,
      width: `calc(${100 / total}% - 4px)`,
      left: `calc(${(col / total) * 100}% + 2px)`,
      position: 'absolute' as const,
    }
  }

  function formatHour (hour: number): string {
    if (props.use24HourClock) return `${String(hour).padStart(2, '0')}:00`
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const currentTimeTopPx = computed(() => {
    const now = new Date()
    return getHourTop(now.getHours()) + (now.getMinutes() / 60) * heightForHour(now.getHours())
  })

  function showNowLineForColumn (columnIndex: number): boolean {
    if (!props.showCurrentTimeIndicator) return false
    if (!props.columnDates) return true
    return isSameDate(props.columnDates[columnIndex], today())
  }

  const sleepStartIconStyle = computed(() => {
    const s = sleepStartHour.value
    const e = sleepEndHour.value
    if (s === null || e === null) return {}
    const startRow = s + 1
    const spanCount = s > e ? 24 - s : e - s
    if (spanCount <= 0) return {}
    return {
      gridColumn: `2 / span ${props.columnCount}`,
      gridRow: `${startRow} / span ${spanCount}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3,
      pointerEvents: 'none' as const,
    }
  })

  const sleepEndIconStyle = computed(() => {
    const s = sleepStartHour.value
    const e = sleepEndHour.value
    if (s === null || e === null) return {}
    if (s <= e || e === 0) return {}
    return {
      gridColumn: `2 / span ${props.columnCount}`,
      gridRow: `1 / span ${e}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3,
      pointerEvents: 'none' as const,
    }
  })

  function getHourFromY (y: number): number {
    let accumulated = 0
    for (const hour of DISPLAY_HOURS) {
      accumulated += heightForHour(hour)
      if (y < accumulated) return hour
    }
    return 23
  }

  function onDayColumnClick (e: MouseEvent, columnIndex: number): void {
    if ((e.target as HTMLElement).closest('.event-block')) return
    const hour = getHourFromY(e.offsetY)
    if (isInSleepRange(hour)) return
    emit('click:hour', { time: `${String(hour).padStart(2, '0')}:00`, columnIndex })
  }

  function nearestAwakeHour (hour: number): number {
    const s = sleepStartHour.value
    const e = sleepEndHour.value
    if (s === null || e === null) return hour
    return e
  }

  function onDayColumnMouseMove (e: MouseEvent, columnIndex: number): void {
    if ((e.target as HTMLElement).closest('.event-block')) {
      hoveredHour.value = null
      hoveredColumn.value = null
      return
    }
    const hour = getHourFromY(e.offsetY)
    if (isInSleepRange(hour)) {
      hoveredHour.value = nearestAwakeHour(hour)
    } else {
      hoveredHour.value = hour
    }
    hoveredColumn.value = columnIndex
  }

  function getMinutesFromY (y: number): number {
    let accumulated = 0
    for (const hour of DISPLAY_HOURS) {
      const h = heightForHour(hour)
      if (y < accumulated + h) {
        const frac = (y - accumulated) / h
        return Math.round((hour * 60 + frac * 60) / 15) * 15
      }
      accumulated += h
    }
    return 23 * 60
  }

  function getTopFromMinutes (minutes: number): number {
    const hour = Math.floor(minutes / 60)
    const minWithinHour = minutes % 60
    return getHourTop(hour) + (minWithinHour / 60) * heightForHour(hour)
  }

  function minutesToTime (minutes: number): string {
    const clamped = Math.max(0, Math.min(23 * 60 + 45, minutes))
    const h = Math.floor(clamped / 60)
    const m = clamped % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const dropIndicatorTop = computed(() =>
    dropTargetMinutes.value === null ? null : getTopFromMinutes(dropTargetMinutes.value),
  )

  function columnY (e: DragEvent): number {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return e.clientY - rect.top
  }

  function onDragOver (e: DragEvent, columnIndex: number): void {
    if (!dragState.eventId) return
    const rawMinutes = getMinutesFromY(columnY(e)) - dragState.grabOffsetMinutes
    dropTargetMinutes.value = Math.max(0, Math.round(rawMinutes / 15) * 15)
    dropTargetColumn.value = columnIndex
  }

  function onDragLeave (e: DragEvent): void {
    const related = e.relatedTarget as HTMLElement | null
    if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
      dropTargetMinutes.value = null
      dropTargetColumn.value = null
    }
  }

  function onDrop (e: DragEvent, columnIndex: number): void {
    e.preventDefault()
    const eventId = dragState.eventId
    if (!eventId) return

    const event = calendarStore.calendarEventFindById(eventId)
    if (!event) return

    const [sh, sm] = event.startTime.split(':').map(Number)
    const [eh, em] = event.endTime.split(':').map(Number)
    const durationMinutes = (eh * 60 + em) - (sh * 60 + sm)

    const dropMinutes = getMinutesFromY(columnY(e))
    const newStartMinutes = Math.max(0, Math.round((dropMinutes - dragState.grabOffsetMinutes) / 15) * 15)
    const newEndMinutes = Math.min(23 * 60 + 45, newStartMinutes + durationMinutes)

    calendarStore.calendarEventUpdate(eventId, {
      startDate: props.columnDates?.[columnIndex] ?? event.startDate,
      startTime: minutesToTime(newStartMinutes),
      endTime: minutesToTime(newEndMinutes),
      isAllDay: false,
    })

    dropTargetMinutes.value = null
    dropTargetColumn.value = null
    dragState.eventId = null
    dragState.grabOffsetMinutes = 0
  }

  watch(() => props.selectedHour, hour => {
    if (hour === null || hour === undefined) return
    const wrapper = gridWrapper.value
    if (!wrapper) return
    const top = getHourTop(hour)
    const rowBottom = top + heightForHour(hour)
    if (top < wrapper.scrollTop || rowBottom > wrapper.scrollTop + wrapper.clientHeight) {
      wrapper.scrollTo({ top: Math.max(0, top - 80), behavior: 'smooth' })
    }
  })

  onMounted(() => {
    if (gridWrapper.value) {
      const currentHour = new Date().getHours()
      gridWrapper.value.scrollTop = getHourTop(Math.max(0, currentHour - 1))
    }
  })
</script>

<style scoped>
.time-grid-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
}

.time-grid {
  display: grid;
  position: relative;
  min-width: 0;
}

.time-grid__hour-label {
  padding: 4px 6px 0 4px;
  font-size: 0.65rem;
  color: rgba(0, 0, 0, 0.4);
  text-align: right;
  user-select: none;
  line-height: 1;
  z-index: 1;
  background: var(--v-theme-surface);
  position: sticky;
  left: 0;
}

.time-grid__divider {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  pointer-events: none;
  z-index: 0;
}

.time-grid__col-separator {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  pointer-events: none;
  z-index: 0;
}

.time-grid__hour-highlight {
  background-color: rgba(62, 76, 94, 0.1);
  pointer-events: none;
  z-index: 1;
}

.time-grid__sleep-block {
  background-color: rgba(44, 61, 85, 0.06);
  pointer-events: auto;
  z-index: 2;
  cursor: pointer;
}

.time-grid__sleep-icon {
  z-index: 3;
  color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.time-grid__day-column {
  position: relative;
  min-width: 80px;
  cursor: pointer;
}

.time-grid__day-column:hover {
  background-color: rgba(62, 76, 94, 0.02);
}

.time-grid__add-event-btn {
  position: absolute;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: background-color 0.15s;
  padding: 0;
}

.time-grid__add-event-btn:hover {
  background: rgba(0, 0, 0, 0.4);
}

.time-grid__overflow-btn {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(62, 76, 94, 0.15);
  border-radius: 2px;
  border: 1px solid rgba(62, 76, 94, 0.2);
  font-size: 1rem;
  color: rgba(62, 76, 94, 0.7);
  cursor: pointer;
  transition: background-color 0.15s ease;
  z-index: 2;
}

.time-grid__overflow-btn:hover {
  background-color: rgba(62, 76, 94, 0.25);
}

.time-grid__current-time {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e53935;
  z-index: 10;
  pointer-events: none;
}

.time-grid__current-time::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #e53935;
}

.time-grid__drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: rgb(var(--v-theme-primary));
  z-index: 20;
  pointer-events: none;
  border-radius: 1px;
}

.time-grid__drop-indicator::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgb(var(--v-theme-primary));
}
</style>
