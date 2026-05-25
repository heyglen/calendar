<template>
  <div class="calendar-page">
    <div class="calendar-page__view-wrapper">
      <transition mode="out-in" :name="appStore.viewTransitionName">
        <CalendarDayView v-if="calendarStore.preferences.view === 'day'" key="day" />
        <CalendarWeekView v-else-if="calendarStore.preferences.view === 'week'" key="week" />
        <CalendarMonthView v-else-if="calendarStore.preferences.view === 'month'" key="month" />
        <UpNextView v-else-if="calendarStore.preferences.view === 'upnext'" key="upnext" />
        <CalendarYearView v-else key="year" />
      </transition>
    </div>

    <EventDialog />
    <SettingsDialog />
    <TaskView />

    <v-btn
      v-if="calendarStore.preferences.view !== 'year' && calendarStore.preferences.view !== 'upnext'"
      class="add-event-btn"
      color="primary"
      elevation="4"
      icon="mdi-plus"
      location="bottom right"
      position="fixed"
      size="large"
      @click="appStore.dialogEventOpen(null)"
    />
  </div>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'

  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

</script>

<style scoped>
.calendar-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-page__view-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.add-event-btn {
  margin: 0 16px 16px 0;
}
</style>
