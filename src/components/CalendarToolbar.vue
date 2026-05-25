<template>
  <div class="toolbar-content">
    <div class="toolbar-left">
      <v-btn
        color="white"
        density="compact"
        icon="mdi-chevron-left"
        variant="text"
        @click="navigatePrevious"
      />

      <v-btn
        class="mx-1"
        color="white"
        size="small"
        variant="tonal"
        @click="navigateToday"
      >
        Today
      </v-btn>

      <v-btn
        color="white"
        density="compact"
        icon="mdi-chevron-right"
        variant="text"
        @click="navigateNext"
      />
    </div>

    <span class="toolbar-title text-white mx-2" :class="titleClass">
      {{ currentLabel }}
    </span>

    <div class="toolbar-right">
      <v-btn-toggle
        color="white"
        density="compact"
        divided
        mandatory
        :model-value="calendarStore.preferences.view"
        variant="outlined"
        @update:model-value="onViewChange"
      >
        <v-btn size="small" style="position:relative" value="upnext">
          <transition name="shortcut-chip">
            <v-chip
              v-if="appStore.altKeyHeld"
              class="toolbar-shortcut-chip"
              color="primary"
              label
              size="x-small"
            >Alt+1</v-chip>
          </transition>

          <v-icon icon="mdi-clock-fast" size="18" />
          <span class="ml-1 d-none d-md-inline">Up Next</span>
        </v-btn>

        <v-btn size="small" style="position:relative" value="day">
          <transition name="shortcut-chip">
            <v-chip
              v-if="appStore.altKeyHeld"
              class="toolbar-shortcut-chip"
              color="primary"
              label
              size="x-small"
            >Alt+2</v-chip>
          </transition>

          <v-icon icon="mdi-view-day" size="18" />
          <span class="ml-1 d-none d-md-inline">Day</span>
        </v-btn>

        <v-btn size="small" style="position:relative" value="week">
          <transition name="shortcut-chip">
            <v-chip
              v-if="appStore.altKeyHeld"
              class="toolbar-shortcut-chip"
              color="primary"
              label
              size="x-small"
            >Alt+3</v-chip>
          </transition>

          <v-icon icon="mdi-view-week" size="18" />
          <span class="ml-1 d-none d-md-inline">Week</span>
        </v-btn>

        <v-btn size="small" style="position:relative" value="month">
          <transition name="shortcut-chip">
            <v-chip
              v-if="appStore.altKeyHeld"
              class="toolbar-shortcut-chip"
              color="primary"
              label
              size="x-small"
            >Alt+4</v-chip>
          </transition>

          <v-icon icon="mdi-calendar-month" size="18" />
          <span class="ml-1 d-none d-md-inline">Month</span>
        </v-btn>

        <v-btn size="small" style="position:relative" value="year">
          <transition name="shortcut-chip">
            <v-chip
              v-if="appStore.altKeyHeld"
              class="toolbar-shortcut-chip"
              color="primary"
              label
              size="x-small"
            >Alt+5</v-chip>
          </transition>

          <v-icon icon="mdi-calendar-range" size="18" />
          <span class="ml-1 d-none d-md-inline">Year</span>
        </v-btn>
      </v-btn-toggle>

      <div class="ml-2 toolbar-icon-wrap" style="position:relative">
        <transition name="shortcut-chip">
          <v-chip
            v-if="appStore.altKeyHeld"
            class="toolbar-shortcut-chip"
            color="primary"
            label
            size="x-small"
          >Alt+F1</v-chip>
        </transition>

        <v-btn
          color="white"
          density="compact"
          icon="mdi-help-circle-outline"
          variant="text"
          @click="appStore.helpDialogToggle()"
        />
      </div>

      <div class="toolbar-icon-wrap" style="position:relative">
        <transition name="shortcut-chip">
          <v-chip
            v-if="appStore.altKeyHeld"
            class="toolbar-shortcut-chip"
            color="primary"
            label
            size="x-small"
          >Alt+,</v-chip>
        </transition>

        <v-btn
          color="white"
          density="compact"
          icon="mdi-cog-outline"
          variant="text"
          @click="appStore.settingsDialogToggle()"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  // appStore is used for altKeyHeld, helpDialogToggle, settingsDialogToggle
  import {
    addDays,
    addMonths,
    formatDisplayDateLong,
    getISOWeekNumber,
    getMonthYear,
    getYear,
    today,
  } from '@/utils/dateUtils'

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()

  const currentLabel = computed(() => {
    const selectedDate = calendarStore.preferences.selectedDate
    const view = calendarStore.preferences.view
    if (view === 'day') return formatDisplayDateLong(selectedDate)
    if (view === 'week') return `Week ${getISOWeekNumber(selectedDate)}`
    if (view === 'month') return getMonthYear(selectedDate)
    if (view === 'upnext') return formatDisplayDateLong(selectedDate)
    return String(getYear(selectedDate))
  })

  const titleClass = computed(() => {
    const view = calendarStore.preferences.view
    if (view === 'day' || view === 'upnext') return 'text-body-1 font-weight-medium'
    return 'text-h5 font-weight-bold'
  })

  const VIEW_ORDER: Record<string, number> = { upnext: 0, day: 1, week: 2, month: 3, year: 4 }

  function onViewChange (newView: string): void {
    const currentView = calendarStore.preferences.view
    const dir = (VIEW_ORDER[newView] ?? 0) > (VIEW_ORDER[currentView] ?? 0) ? 'zoom-out' : 'zoom-in'
    appStore.setViewTransitionName(dir)
    calendarStore.viewPreferenceSetView(newView as 'day' | 'week' | 'month' | 'year' | 'upnext')
  }

  function navigateToday (): void {
    calendarStore.viewPreferenceSetDate(today())
  }

  function navigatePrevious (): void {
    appStore.setNavigationDirection('backward')
    const view = calendarStore.preferences.view
    const date = calendarStore.preferences.selectedDate
    switch (view) {
      case 'month': {
        calendarStore.viewPreferenceSetDate(addMonths(date, -1))
        break
      }
      case 'year': {
        calendarStore.viewPreferenceSetDate(addMonths(date, -12))
        break
      }
      case 'week': {
        calendarStore.viewPreferenceSetDate(addDays(date, -7))
        break
      }
      default: { calendarStore.viewPreferenceSetDate(addDays(date, -1))
      }
    }
  }

  function navigateNext (): void {
    appStore.setNavigationDirection('forward')
    const view = calendarStore.preferences.view
    const date = calendarStore.preferences.selectedDate
    switch (view) {
      case 'month': {
        calendarStore.viewPreferenceSetDate(addMonths(date, 1))
        break
      }
      case 'year': {
        calendarStore.viewPreferenceSetDate(addMonths(date, 12))
        break
      }
      case 'week': {
        calendarStore.viewPreferenceSetDate(addDays(date, 7))
        break
      }
      default: { calendarStore.viewPreferenceSetDate(addDays(date, 1))
      }
    }
  }
</script>

<style scoped>
.toolbar-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 8px;
  gap: 4px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  min-width: 0;
}

.toolbar-right {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.toolbar-icon-wrap {
  display: flex;
  align-items: center;
}

.toolbar-shortcut-chip {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-30%, -50%);
  transform-origin: bottom right;
  z-index: 10;
  pointer-events: none;
}
</style>
