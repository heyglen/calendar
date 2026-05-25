<template>
  <div
    ref="yearViewRef"
    class="year-view"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <div class="year-view__year-title">{{ selectedYear }}</div>

    <div class="year-view__grid">
      <div
        v-for="(monthDate, index) in twelveMonths"
        :key="monthDate"
        class="year-view__month-card"
        :class="{ 'year-view__month-card--selected': index === selectedMonthIndex }"
        @click="navigateToMonth(monthDate)"
      >
        <div class="year-view__month-title">{{ getMonthName(monthDate) }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import {
    formatDate,
    getMonthName,
    getYear,
  } from '@/utils/dateUtils'

  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

  const yearViewRef = ref<HTMLElement | null>(null)

  const selectedYear = computed(() => getYear(calendarStore.preferences.selectedDate))

  const twelveMonths = computed(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = new Date(selectedYear.value, i, 1)
      return formatDate(d)
    }),
  )

  const selectedMonthIndex = ref(new Date(calendarStore.preferences.selectedDate).getMonth())

  watch(
    () => calendarStore.preferences.selectedDate,
    date => {
      selectedMonthIndex.value = new Date(date).getMonth()
    },
  )

  function navigateToMonth (monthDate: string): void {
    calendarStore.viewPreferenceSetDate(monthDate)
    calendarStore.viewPreferenceSetView('month')
  }

  function onKeyDown (e: KeyboardEvent): void {
    if (appStore.settingsDialogOpen) return

    const COLS = 4
    const cur = selectedMonthIndex.value

    switch (e.key) {
      case 'ArrowLeft': {
        if (e.shiftKey) break
        e.preventDefault()
        e.stopPropagation()
        selectedMonthIndex.value = (cur - 1 + 12) % 12
        break
      }
      case 'ArrowRight': {
        if (e.shiftKey) break
        e.preventDefault()
        e.stopPropagation()
        selectedMonthIndex.value = (cur + 1) % 12
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        e.stopPropagation()
        selectedMonthIndex.value = Math.max(0, cur - COLS)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        e.stopPropagation()
        selectedMonthIndex.value = Math.min(11, cur + COLS)
        break
      }
      case 'Enter': {
        e.preventDefault()
        navigateToMonth(twelveMonths.value[selectedMonthIndex.value])
        break
      }
      // No default
    }
  }

  watch(
    () => appStore.settingsDialogOpen,
    isOpen => {
      if (!isOpen) yearViewRef.value?.focus()
    },
  )

  onMounted(() => {
    yearViewRef.value?.focus()
  })
</script>

<style scoped>
.year-view {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  outline: none;
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
  padding: 16px 10px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.year-view__month-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.15);
}

.year-view__month-card--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.year-view__month-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #3e4c5e;
  text-align: center;
  margin-bottom: 0;
}
</style>
