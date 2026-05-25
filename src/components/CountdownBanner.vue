<template>
  <div v-if="countdownEvents.length > 0" class="countdown-banner">
    <div
      v-for="event in countdownEvents"
      :key="event.id"
      class="countdown-banner__item"
      :style="{ borderLeftColor: event.color }"
    >
      <v-icon
        v-if="event.iconLibrary === 'mdi'"
        class="mr-1"
        :color="event.color"
        :icon="event.icon"
        size="14"
      />

      <i
        v-else
        :class="`fas fa-${event.icon.replace('fa-', '')}`"
        :style="{ color: event.color, fontSize: '0.8rem', marginRight: '4px' }"
      />

      <span class="countdown-banner__label">
        <template v-if="daysUntil(event.startDate) === 0">Today: </template>
        <template v-else-if="daysUntil(event.startDate) === 1">Tomorrow: </template>
        <template v-else>{{ daysUntil(event.startDate) }} days until </template>
        <strong>{{ event.title }}</strong>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useCalendarStore } from '@/stores/calendar'
  import { parseLocalDate, today } from '@/utils/dateUtils'

  const calendarStore = useCalendarStore()

  const todayStr = today()

  function daysUntil (dateString: string): number {
    const t = parseLocalDate(todayStr)
    const d = parseLocalDate(dateString)
    return Math.round((d.getTime() - t.getTime()) / 86_400_000)
  }

  const countdownEvents = computed(() =>
    calendarStore.events.filter(e =>
      e.isAllDay
      && e.showCountdown
      && e.recurrence.type === 'none'
      && e.startDate >= todayStr,
    ).toSorted((a, b) => a.startDate.localeCompare(b.startDate)),
  )
</script>

<style scoped>
.countdown-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.countdown-banner__item {
  display: flex;
  align-items: center;
  font-size: 0.78rem;
  padding: 3px 8px 3px 6px;
  border-left: 3px solid;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0 4px 4px 0;
}

.countdown-banner__label {
  color: rgba(0, 0, 0, 0.7);
}
</style>
