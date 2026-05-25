<template>
  <v-app style="height: 100dvh; overflow: hidden;">
    <v-app-bar color="primary" density="compact" elevation="0">
      <CalendarToolbar />
    </v-app-bar>

    <v-main style="overflow: hidden; display: flex; flex-direction: column; height: 100%;">
      <CountdownBanner />
      <router-view />
      <PersonFilterBar v-if="calendarStore.preferences.people.length > 1" />
    </v-main>

    <KeyboardShortcutsDialog v-model="showShortcutsHelp" />
  </v-app>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
  import { useCalendarStore } from '@/stores/calendar'

  const showShortcutsHelp = ref(false)
  useKeyboardShortcuts(() => {
    showShortcutsHelp.value = true
  })

  const calendarStore = useCalendarStore()
  const vuetifyTheme = useTheme()

  watch(
    () => calendarStore.preferences.theme,
    theme => {
      if (theme) vuetifyTheme.global.name.value = theme
    },
    { immediate: true },
  )
</script>

<style>
/* Slide transitions for date navigation */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.slide-left-enter-from  { transform: translateX(40px); opacity: 0; }
.slide-left-leave-to    { transform: translateX(-40px); opacity: 0; }
.slide-right-enter-from { transform: translateX(-40px); opacity: 0; }
.slide-right-leave-to   { transform: translateX(40px); opacity: 0; }

/* Zoom transitions for view switching */
.zoom-out-enter-active,
.zoom-out-leave-active,
.zoom-in-enter-active,
.zoom-in-leave-active {
  transition: transform 0.26s ease, opacity 0.26s ease;
}

.zoom-out-enter-from { transform: scale(1.05); opacity: 0; }
.zoom-out-leave-to   { transform: scale(0.95); opacity: 0; }
.zoom-in-enter-from  { transform: scale(0.95); opacity: 0; }
.zoom-in-leave-to    { transform: scale(1.05); opacity: 0; }
</style>
