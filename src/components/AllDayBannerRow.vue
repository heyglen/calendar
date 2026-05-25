<template>
  <div v-if="showBanner" class="all-day-banner" :class="{ 'all-day-banner--drag-active': isDragActive }">
    <div class="all-day-banner__label">All day</div>

    <div class="all-day-banner__columns">
      <div
        v-for="(columnEvents, colIndex) in columns"
        :key="colIndex"
        class="all-day-banner__column"
        :class="{ 'all-day-banner__column--drag-over': dragOverColumn === colIndex }"
        @dragenter="dragOverColumn = colIndex"
        @dragleave="onColumnDragLeave($event, colIndex)"
        @dragover.prevent
        @drop="onDropAllDay($event, colIndex)"
      >
        <div
          v-for="event in columnEvents"
          :key="event.id"
          class="all-day-banner__chip"
          :style="{ backgroundColor: event.color }"
          :title="event.title || undefined"
          @click="onEventClick(event, colIndex)"
        >
          <v-icon
            v-if="event.iconLibrary === 'mdi'"
            class="all-day-banner__chip-icon"
            color="white"
            :icon="event.icon"
          />

          <i
            v-else
            :class="`fas fa-${event.icon.replace('fa-', '')} all-day-banner__chip-fa-icon`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, ref } from 'vue'
  import { dragState } from '@/composables/useDragDrop'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'

  const props = defineProps<{
    columns: CalendarEvent[][]
    columnDates?: string[]
  }>()

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()
  const dragOverColumn = ref<number | null>(null)

  const hasAnyAllDay = computed(() => props.columns.some(col => col.length > 0))
  const isDragActive = computed(() => dragState.eventId !== null)
  const showBanner = computed(() => hasAnyAllDay.value || isDragActive.value)

  function onEventClick (event: CalendarEvent, colIndex: number): void {
    const date = props.columnDates?.[colIndex]
    if (event.subtasks?.length && date) {
      appStore.taskViewOpen(event.id, date)
    } else {
      appStore.dialogEventOpen(event.id)
    }
  }

  function onColumnDragLeave (e: DragEvent, colIndex: number): void {
    const related = e.relatedTarget as HTMLElement | null
    if ((!related || !(e.currentTarget as HTMLElement).contains(related)) && dragOverColumn.value === colIndex) dragOverColumn.value = null
  }

  function onDropAllDay (e: DragEvent, colIndex: number): void {
    e.preventDefault()
    const eventId = dragState.eventId
    if (!eventId) return
    const event = calendarStore.calendarEventFindById(eventId)
    if (!event) return
    const targetDate = props.columnDates?.[colIndex] ?? event.startDate
    calendarStore.calendarEventUpdate(eventId, {
      isAllDay: true,
      startDate: targetDate,
      startTime: '00:00',
      endTime: '23:59',
    })
    dragOverColumn.value = null
    dragState.eventId = null
    dragState.grabOffsetMinutes = 0
  }
</script>

<style scoped>
.all-day-banner {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: var(--v-theme-surface);
  flex-shrink: 0;
  min-height: 40px;
  padding: 4px 0;
}

.all-day-banner__label {
  width: 56px;
  flex-shrink: 0;
  font-size: 0.65rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
  text-align: right;
  padding-right: 8px;
  padding-top: 6px;
}

.all-day-banner__columns {
  display: flex;
  flex: 1;
  gap: 0;
}

.all-day-banner__column {
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  padding: 2px;
  min-width: 0;
}

.all-day-banner__chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  flex-shrink: 0;
  container-type: size;
}

.all-day-banner__chip-icon {
  font-size: 90cqh !important;
  width: 90cqh;
  height: 90cqh;
}

.all-day-banner__chip-fa-icon {
  font-size: 90cqh;
  color: white;
}

.all-day-banner__chip:hover {
  opacity: 0.85;
  transform: scale(1.08);
}

.all-day-banner--drag-active {
  min-height: 44px;
}

.all-day-banner__column--drag-over {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-radius: 4px;
  outline: 2px dashed rgba(var(--v-theme-primary), 0.5);
  outline-offset: -2px;
}
</style>
