<template>
  <div class="year-view">
    <div class="year-view__year-title">{{ selectedYear }}</div>

    <div class="year-view__grid">
      <div
        v-for="monthDate in twelveMonths"
        :key="monthDate"
        class="year-view__month-card"
        @click="navigateToMonth(monthDate)"
      >
        <div class="year-view__month-title">{{ getMonthName(monthDate) }}</div>
        <!-- Mini weekday headers -->
        <div class="year-view__mini-headers">
          <span v-for="(d, i) in miniWeekdayNames" :key="i" class="year-view__mini-header">{{ d }}</span>
        </div>
        <!-- Mini day grid -->
        <div class="year-view__mini-grid">
          <div
            v-for="cell in getMiniMonth(monthDate)"
            :key="cell.date"
            class="year-view__mini-cell"
            :class="{
              'year-view__mini-cell--other-month': !cell.isCurrentMonth,
              'year-view__mini-cell--today': isSameDate(cell.date, todayDate),
            }"
          >
            <span class="year-view__mini-day">{{ getDayNumber(cell.date) }}</span>
            <span v-if="cell.isCurrentMonth && hasEvents(cell.date)" class="year-view__dot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { getEventsForDate } from '@/composables/useRecurrence'
  import { useCalendarStore } from '@/stores/calendar'
  import {
    formatDate,
    getDayNumber,
    getMonthGridDates,
    getMonthName,
    getYear,
    isSameDate,
    today,
  } from '@/utils/dateUtils'

  const calendarStore = useCalendarStore()

  const todayDate = today()
  const miniWeekdayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const selectedYear = computed(() => getYear(calendarStore.preferences.selectedDate))

  const twelveMonths = computed(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = new Date(selectedYear.value, i, 1)
      return formatDate(d)
    }),
  )

  function getMiniMonth (monthDate: string) {
    return getMonthGridDates(monthDate)
  }

  function hasEvents (dateString: string): boolean {
    return getEventsForDate(calendarStore.events, dateString).length > 0
  }

  function navigateToMonth (monthDate: string): void {
    calendarStore.viewPreferenceSetDate(monthDate)
    calendarStore.viewPreferenceSetView('month')
  }
</script>

<style scoped>
.year-view {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.year-view__year-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: #3e4c5e;
  text-align: center;
  line-height: 1;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
  opacity: 0.85;
}

.year-view__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .year-view__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .year-view__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .year-view__grid {
    grid-template-columns: 1fr;
  }
}

.year-view__month-card {
  background: var(--v-theme-surface);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.year-view__month-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.15);
}

.year-view__month-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3e4c5e;
  margin-bottom: 6px;
}

.year-view__mini-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}

.year-view__mini-header {
  font-size: 0.55rem;
  color: rgba(0, 0, 0, 0.35);
  text-align: center;
  font-weight: 500;
}

.year-view__mini-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.year-view__mini-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 1px 0;
}

.year-view__mini-cell--other-month .year-view__mini-day {
  opacity: 0.3;
}

.year-view__mini-cell--today .year-view__mini-day {
  background-color: #3e4c5e;
  color: white;
  border-radius: 50%;
}

.year-view__mini-day {
  font-size: 0.6rem;
  color: #3e4c5e;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.year-view__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: #3e4c5e;
  opacity: 0.6;
}
</style>
