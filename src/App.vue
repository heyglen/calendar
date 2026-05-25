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

    <KeyboardShortcutsDialog v-model="appStore.helpDialogOpen" />
  </v-app>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'

  const appStore = useAppStore()

  useKeyboardShortcuts(() => {
    appStore.helpDialogOpen = true
  })

  const calendarStore = useCalendarStore()
  const vuetifyTheme = useTheme()

  const systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  function applyTheme (theme: string | undefined): void {
    if (!theme) return
    const resolved = theme === 'system'
      ? (systemMediaQuery.matches ? 'dark' : 'light')
      : theme
    vuetifyTheme.global.name.value = resolved
  }

  watch(() => calendarStore.preferences.theme, applyTheme, { immediate: true })

  function onKeyDown (e: KeyboardEvent): void {
    if (e.key === 'Alt') appStore.altKeyHeld = true
  }

  function onKeyUp (e: KeyboardEvent): void {
    if (e.key === 'Alt') appStore.altKeyHeld = false
  }

  function onBlur (): void {
    appStore.altKeyHeld = false
  }

  function onSystemThemeChange (): void {
    if (calendarStore.preferences.theme === 'system') {
      applyTheme('system')
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    systemMediaQuery.addEventListener('change', onSystemThemeChange)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    systemMediaQuery.removeEventListener('change', onSystemThemeChange)
  })
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

/* Vertical slide transitions for month view */
.slide-up-enter-active,
.slide-up-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.slide-up-enter-from   { transform: translateY(-40px); opacity: 0; }
.slide-up-leave-to     { transform: translateY(40px);  opacity: 0; }
.slide-down-enter-from { transform: translateY(40px);  opacity: 0; }
.slide-down-leave-to   { transform: translateY(-40px); opacity: 0; }

/* Add-event button slide-in from right */
.add-btn-enter-active { transition: transform 0.18s ease, opacity 0.15s; }
.add-btn-leave-active { transition: transform 0.1s ease, opacity 0.1s; }
.add-btn-enter-from   { transform: translateX(18px); opacity: 0; }
.add-btn-leave-to     { transform: translateX(18px); opacity: 0; }

/* Shortcut chip grow/shrink */
.shortcut-chip-enter-active { transition: transform 0.08s ease-out, opacity 0.08s; }
.shortcut-chip-leave-active { transition: transform 0.08s ease-in,  opacity 0.08s; }
.shortcut-chip-enter-from,
.shortcut-chip-leave-to     { transform: translate(-30%, -50%) scale(0); opacity: 0; }
</style>
