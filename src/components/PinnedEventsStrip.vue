<template>
  <div class="pinned-strip">
    <div class="pinned-strip__label">
      <v-icon icon="mdi-pin" size="12" />
    </div>

    <div class="pinned-strip__events">
      <div
        v-for="event in events"
        :key="event.id"
        class="pinned-strip__chip"
        :style="{ borderLeftColor: event.color, backgroundColor: event.color + '18' }"
        @click="onEventClick(event)"
      >
        <div class="pinned-strip__icon-wrap" :style="{ backgroundColor: event.color }">
          <v-icon
            v-if="event.iconLibrary === 'mdi'"
            color="white"
            :icon="event.icon"
            size="14"
          />

          <i
            v-else
            :class="`fas fa-${event.icon.replace('fa-', '')}`"
            style="font-size: 0.8rem; color: white"
          />
        </div>

        <span class="pinned-strip__title">{{ event.title || formatDisplayTimeWithFormat(event.startTime, calendarStore.preferences.use24HourClock) }}</span>

        <span class="pinned-strip__time">
          {{ formatDisplayTimeWithFormat(event.startTime, calendarStore.preferences.use24HourClock) }}
          –
          {{ formatDisplayTimeWithFormat(event.endTime, calendarStore.preferences.use24HourClock) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { formatDisplayTimeWithFormat } from '@/utils/dateUtils'

  const props = defineProps<{
    events: CalendarEvent[]
    date: string
  }>()

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()

  function onEventClick (event: CalendarEvent): void {
    if (event.subtasks?.length && props.date) {
      appStore.taskViewOpen(event.id, props.date)
    } else {
      appStore.dialogEventOpen(event.id)
    }
  }
</script>

<style scoped>
.pinned-strip {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--v-theme-surface);
  flex-shrink: 0;
  padding: 4px 0;
  min-height: 32px;
}

.pinned-strip__label {
  width: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  padding-top: 6px;
  color: rgba(0, 0, 0, 0.35);
}

.pinned-strip__events {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  min-width: 0;
}

.pinned-strip__chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 6px;
  border-left: 3px solid;
  border-radius: 0 2px 2px 0;
  cursor: pointer;
  transition: filter 0.15s;
  width: 100%;
}

.pinned-strip__chip:hover {
  filter: brightness(0.95);
}

.pinned-strip__icon-wrap {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pinned-strip__title {
  font-size: 0.82rem;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.8);
}

.pinned-strip__time {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
