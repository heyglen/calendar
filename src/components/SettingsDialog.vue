<template>
  <v-dialog
    max-width="640"
    :model-value="appStore.settingsDialogOpen"
    @update:model-value="v => { if (!v) appStore.settingsDialogOpen = false }"
  >
    <v-card @keydown="onSettingsKeyDown">
      <v-card-title class="pa-4 pb-0 d-flex align-center">
        <span class="text-h6">Settings</span>
        <v-spacer />
        <v-btn density="compact" icon="mdi-close" variant="text" @click="appStore.settingsDialogOpen = false" />
      </v-card-title>

      <v-card-text class="pa-0 d-flex settings-dialog__body">
        <v-tabs
          v-model="activeTab"
          class="settings-dialog__tabs"
          color="primary"
          direction="vertical"
        >
          <v-tab prepend-icon="mdi-monitor-dashboard" value="display">Display</v-tab>
          <v-tab prepend-icon="mdi-sleep" value="sleep">Sleep</v-tab>
          <v-tab prepend-icon="mdi-account-group" value="people">People</v-tab>
          <v-tab prepend-icon="mdi-database-outline" value="data">Data</v-tab>
        </v-tabs>

        <v-divider vertical />

        <v-window v-model="activeTab" class="settings-dialog__panel">
          <!-- Display -->
          <v-window-item class="pa-4" value="display">
            <!-- Theme selector -->
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Theme</div>

            <div class="d-flex gap-2 flex-wrap mb-4">
              <v-btn
                v-for="t in THEMES"
                :key="t.value"
                :color="calendarStore.preferences.theme === t.value ? 'primary' : 'default'"
                density="comfortable"
                size="small"
                :variant="calendarStore.preferences.theme === t.value ? 'flat' : 'tonal'"
                @click="calendarStore.preferencesSetTheme(t.value)"
              >
                {{ t.label }}
              </v-btn>
            </div>

            <v-divider class="mb-4" />

            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-body-2">24-hour clock</div>
                <div class="text-caption text-medium-emphasis">Show times as 14:00 instead of 2:00 PM</div>
              </div>

              <v-switch
                color="primary"
                density="compact"
                hide-details
                :model-value="calendarStore.preferences.use24HourClock"
                @update:model-value="calendarStore.preferencesSetUse24HourClock(!!$event)"
              />
            </div>

            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-body-2">Show event titles</div>
                <div class="text-caption text-medium-emphasis">Always display title text on events</div>
              </div>

              <v-switch
                color="primary"
                density="compact"
                hide-details
                :model-value="calendarStore.preferences.showEventTitles ?? false"
                @update:model-value="calendarStore.preferencesSetShowEventTitles(!!$event)"
              />
            </div>
          </v-window-item>

          <!-- Sleep -->
          <v-window-item class="pa-4" value="sleep">
            <div class="text-caption text-medium-emphasis mb-4">
              Sleep hours are compressed in the schedule so your day plan stays in focus.
              Set different times for specific days or dates.
            </div>

            <!-- Default times -->
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Default</div>

            <div class="d-flex gap-3 align-center mb-4">
              <AppTimeField
                clearable
                label="Bedtime"
                :model-value="currentSchedule().default.start ?? ''"
                :use24-hour-clock="calendarStore.preferences.use24HourClock"
                @clear="updateDefault('start', null)"
                @update:model-value="updateDefault('start', $event)"
              />

              <v-icon color="medium-emphasis" icon="mdi-arrow-right" size="18" />

              <AppTimeField
                clearable
                label="Wake up"
                :model-value="currentSchedule().default.end ?? ''"
                :use24-hour-clock="calendarStore.preferences.use24HourClock"
                @clear="updateDefault('end', null)"
                @update:model-value="updateDefault('end', $event)"
              />
            </div>

            <!-- Per-day overrides -->
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Per-day overrides</div>

            <div class="sleep-weekdays mb-4">
              <div
                v-for="{ weekday, label } in WEEKDAY_LABELS"
                :key="weekday"
                class="sleep-weekday-row"
              >
                <v-checkbox
                  color="primary"
                  density="compact"
                  hide-details
                  :label="label"
                  :model-value="isWeekdayOverrideEnabled(weekday)"
                  @update:model-value="toggleWeekdayOverride(weekday)"
                />

                <template v-if="isWeekdayOverrideEnabled(weekday)">
                  <div class="sleep-weekday-times">
                    <AppTimeField
                      label="Bedtime"
                      :model-value="getWeekdayTime(weekday, 'start')"
                      :use24-hour-clock="calendarStore.preferences.use24HourClock"
                      @update:model-value="updateWeekdayTime(weekday, 'start', $event)"
                    />

                    <AppTimeField
                      label="Wake up"
                      :model-value="getWeekdayTime(weekday, 'end')"
                      :use24-hour-clock="calendarStore.preferences.use24HourClock"
                      @update:model-value="updateWeekdayTime(weekday, 'end', $event)"
                    />
                  </div>
                </template>
              </div>
            </div>

            <!-- Date-specific overrides -->
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Date overrides</div>

            <div v-if="currentSchedule().overrides.length > 0" class="mb-3">
              <div
                v-for="(override, index) in currentSchedule().overrides"
                :key="index"
                class="sleep-override-row mb-2"
              >
                <v-text-field
                  density="compact"
                  hide-details
                  label="Date"
                  :model-value="override.date"
                  style="max-width: 150px"
                  type="date"
                  variant="outlined"
                  @update:model-value="updateDateOverride(index, 'date', $event)"
                />

                <AppTimeField
                  label="Bedtime"
                  :model-value="override.start ?? ''"
                  style="max-width: 130px"
                  :use24-hour-clock="calendarStore.preferences.use24HourClock"
                  @update:model-value="updateDateOverride(index, 'start', $event)"
                />

                <v-icon color="medium-emphasis" icon="mdi-arrow-right" size="14" />

                <AppTimeField
                  label="Wake up"
                  :model-value="override.end ?? ''"
                  style="max-width: 130px"
                  :use24-hour-clock="calendarStore.preferences.use24HourClock"
                  @update:model-value="updateDateOverride(index, 'end', $event)"
                />

                <v-btn
                  color="error"
                  density="compact"
                  icon="mdi-close"
                  size="small"
                  variant="text"
                  @click="removeDateOverride(index)"
                />
              </div>
            </div>

            <div class="d-flex gap-3">
              <v-btn
                color="secondary"
                prepend-icon="mdi-plus"
                size="small"
                variant="tonal"
                @click="addDateOverride"
              >
                Add date override
              </v-btn>

              <v-btn
                v-if="hasAnySleepConfig"
                color="error"
                size="small"
                variant="text"
                @click="clearAllSleep"
              >
                Clear all
              </v-btn>
            </div>
          </v-window-item>

          <!-- People -->
          <v-window-item class="pa-4" value="people">
            <div class="text-caption text-medium-emphasis mb-3">
              Track events per family member. Add a photo and filter the calendar by person.
            </div>

            <v-list v-if="calendarStore.preferences.people.length > 0" class="mb-2 pa-0" density="compact">
              <v-list-item
                v-for="person in calendarStore.preferences.people"
                :key="person.id"
                class="px-0"
                :ripple="false"
              >
                <template #prepend>
                  <v-avatar
                    class="mr-3"
                    :color="person.avatarBase64 ? undefined : person.color"
                    :image="person.avatarBase64 || undefined"
                    size="36"
                  >
                    <span v-if="!person.avatarBase64" class="text-caption text-white font-weight-bold">
                      {{ person.name.charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ person.name }}</v-list-item-title>

                <template #append>
                  <v-btn
                    class="mr-1"
                    density="compact"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="openEditPerson(person)"
                  />

                  <v-btn
                    color="error"
                    density="compact"
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    @click="deletePerson(person.id)"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-btn
              color="secondary"
              prepend-icon="mdi-plus"
              size="small"
              variant="tonal"
              @click="openAddPerson"
            >
              Add Person
            </v-btn>
          </v-window-item>

          <!-- Data -->
          <v-window-item class="pa-4" value="data">
            <v-tabs v-model="dataTab" class="mb-4" color="primary" density="compact">
              <v-tab value="export">Export</v-tab>
              <v-tab value="import">Import</v-tab>
            </v-tabs>

            <v-window v-model="dataTab">
              <v-window-item value="export">
                <div class="text-caption text-medium-emphasis mb-3">
                  Download all your events as a JSON backup file.
                </div>

                <v-btn
                  color="secondary"
                  prepend-icon="mdi-download"
                  variant="tonal"
                  @click="exportData"
                >
                  Export JSON
                </v-btn>
              </v-window-item>

              <v-window-item value="import">
                <div class="text-caption text-medium-emphasis mb-3">
                  Paste a previously exported JSON file to restore your events.
                </div>

                <v-textarea
                  v-model="importJson"
                  class="mb-2"
                  :error-messages="importError ? [importError] : []"
                  hide-details="auto"
                  label="Paste exported JSON here"
                  rows="5"
                  variant="outlined"
                />

                <v-btn
                  color="primary"
                  :disabled="!importJson.trim()"
                  prepend-icon="mdi-upload"
                  variant="flat"
                  @click="doImportData"
                >
                  Import
                </v-btn>
              </v-window-item>
            </v-window>

            <v-snackbar v-model="importSuccess" color="success" timeout="3000">
              Data imported successfully.
            </v-snackbar>

            <v-divider class="mt-4 mb-3" />

            <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Danger Zone</div>

            <div class="text-caption text-medium-emphasis mb-3">
              Delete all events and reset all settings to defaults. This cannot be undone.
            </div>

            <template v-if="!confirmingReset">
              <v-btn color="error" prepend-icon="mdi-delete-forever" variant="outlined" @click="confirmingReset = true">
                Reset all data
              </v-btn>
            </template>

            <template v-else>
              <div class="text-body-2 mb-3">Are you sure? All events and settings will be permanently deleted.</div>

              <div class="d-flex gap-2">
                <v-btn color="error" variant="flat" @click="doResetAllData">Confirm reset</v-btn>

                <v-btn variant="text" @click="confirmingReset = false">Cancel</v-btn>
              </div>
            </template>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Person edit dialog -->
  <v-dialog v-model="personDialogOpen" max-width="400">
    <v-card>
      <v-card-title class="pa-4 pb-0">{{ editingPerson ? 'Edit Person' : 'Add Person' }}</v-card-title>

      <v-card-text class="pa-4">
        <!-- Avatar preview + upload -->
        <div class="d-flex align-center gap-4 mb-4">
          <div class="person-avatar-wrapper" @click="triggerAvatarUpload">
            <v-avatar
              :color="personDraft.avatarBase64 ? undefined : (personDraft.color || '#2980b9')"
              :image="personDraft.avatarBase64 || undefined"
              size="56"
            >
              <span v-if="!personDraft.avatarBase64" class="text-h6 text-white font-weight-bold">
                {{ personDraft.name ? personDraft.name.charAt(0).toUpperCase() : '?' }}
              </span>
            </v-avatar>

            <div class="person-avatar-overlay">
              <v-icon color="white" icon="mdi-camera" size="18" />
            </div>
          </div>

          <v-btn
            v-if="personDraft.avatarBase64"
            color="error"
            size="small"
            variant="text"
            @click="personDraft.avatarBase64 = undefined"
          >
            Remove photo
          </v-btn>

          <input
            ref="avatarFileInput"
            accept="image/*"
            style="display: none"
            type="file"
            @change="onAvatarUpload"
          >
        </div>

        <v-text-field
          v-model="personDraft.name"
          autofocus
          class="mb-4"
          density="compact"
          hide-details
          label="Name"
          variant="outlined"
        />

        <!-- Color swatches -->
        <div class="d-flex align-center flex-wrap gap-2">
          <span class="text-caption text-medium-emphasis mr-1">Color</span>

          <button
            v-for="c in PALETTE_COLORS"
            :key="c"
            class="settings-color-swatch"
            :class="{ 'settings-color-swatch--selected': personDraft.color === c }"
            :style="{ backgroundColor: c }"
            type="button"
            @click="personDraft.color = c"
          />
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="personDialogOpen = false">Cancel</v-btn>

        <v-btn
          color="primary"
          :disabled="!personDraft.name.trim()"
          variant="flat"
          @click="savePerson"
        >
          {{ editingPerson ? 'Save' : 'Add' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { CalendarEvent, Person, SleepSchedule, WeekdayNumber } from '@/types/calendar'
  import { computed, reactive, ref, watch } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { PALETTE_COLORS } from '@/types/calendar'
  import { today } from '@/utils/dateUtils'

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()

  const activeTab = ref('display')

  watch(
    () => appStore.settingsInitialTab,
    tab => {
      if (tab) {
        activeTab.value = tab
        appStore.settingsInitialTab = null
      }
    },
  )

  const SETTINGS_TABS = ['display', 'sleep', 'people', 'data']

  function onSettingsKeyDown (e: KeyboardEvent): void {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    const tag = (e.target as HTMLElement).tagName
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
    e.preventDefault()
    e.stopPropagation()
    const idx = SETTINGS_TABS.indexOf(activeTab.value)
    activeTab.value = e.key === 'ArrowUp' ? SETTINGS_TABS[Math.max(0, idx - 1)] : SETTINGS_TABS[Math.min(SETTINGS_TABS.length - 1, idx + 1)]
  }

  const THEMES = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Warm', value: 'warm' },
    { label: 'Cool', value: 'cool' },
  ]

  // ─── Sleep schedule ──────────────────────────────────────────────────────────

  const WEEKDAY_LABELS: { weekday: WeekdayNumber, label: string }[] = [
    { weekday: 1, label: 'Monday' },
    { weekday: 2, label: 'Tuesday' },
    { weekday: 3, label: 'Wednesday' },
    { weekday: 4, label: 'Thursday' },
    { weekday: 5, label: 'Friday' },
    { weekday: 6, label: 'Saturday' },
    { weekday: 0, label: 'Sunday' },
  ]

  function currentSchedule (): SleepSchedule {
    return calendarStore.preferences.sleepSchedule ?? {
      default: { start: calendarStore.preferences.sleepStart, end: calendarStore.preferences.sleepEnd },
      weekdays: {},
      overrides: [],
    }
  }

  function updateDefault (field: 'start' | 'end', value: string | null): void {
    const s = currentSchedule()
    calendarStore.preferencesSetSleepSchedule({ ...s, default: { ...s.default, [field]: value || null } })
  }

  function isWeekdayOverrideEnabled (weekday: WeekdayNumber): boolean {
    return weekday in (currentSchedule().weekdays)
  }

  function toggleWeekdayOverride (weekday: WeekdayNumber): void {
    const s = currentSchedule()
    const updated = { ...s.weekdays }
    if (weekday in updated) {
      delete updated[weekday]
    } else {
      updated[weekday] = { start: s.default.start, end: s.default.end }
    }
    calendarStore.preferencesSetSleepSchedule({ ...s, weekdays: updated })
  }

  function getWeekdayTime (weekday: WeekdayNumber, field: 'start' | 'end'): string {
    return currentSchedule().weekdays[weekday]?.[field] ?? ''
  }

  function updateWeekdayTime (weekday: WeekdayNumber, field: 'start' | 'end', value: string): void {
    const s = currentSchedule()
    const existing = s.weekdays[weekday] ?? { start: s.default.start, end: s.default.end }
    calendarStore.preferencesSetSleepSchedule({
      ...s,
      weekdays: { ...s.weekdays, [weekday]: { ...existing, [field]: value || null } },
    })
  }

  function addDateOverride (): void {
    const s = currentSchedule()
    calendarStore.preferencesSetSleepSchedule({
      ...s,
      overrides: [...s.overrides, { date: today(), start: s.default.start, end: s.default.end }],
    })
  }

  function removeDateOverride (index: number): void {
    const s = currentSchedule()
    calendarStore.preferencesSetSleepSchedule({
      ...s,
      overrides: s.overrides.filter((_, i) => i !== index),
    })
  }

  function updateDateOverride (index: number, field: 'date' | 'start' | 'end', value: string): void {
    const s = currentSchedule()
    const updated = s.overrides.map((o, i) => i === index ? { ...o, [field]: value || null } : o)
    calendarStore.preferencesSetSleepSchedule({ ...s, overrides: updated })
  }

  function clearAllSleep (): void {
    calendarStore.preferencesSetSleepSchedule(null)
  }

  const hasAnySleepConfig = computed(() =>
    !!(calendarStore.preferences.sleepSchedule?.default.start
      || calendarStore.preferences.sleepSchedule?.default.end
      || calendarStore.preferences.sleepStart
      || calendarStore.preferences.sleepEnd),
  )

  // ─── People / data ────────────────────────────────────────────────────────────

  const dataTab = ref('export')
  const importJson = ref('')
  const importError = ref('')
  const importSuccess = ref(false)
  const confirmingReset = ref(false)

  function doResetAllData (): void {
    calendarStore.clearAllData()
    confirmingReset.value = false
    appStore.settingsDialogOpen = false
  }

  const personDialogOpen = ref(false)
  const editingPerson = ref<Person | null>(null)
  const personDraft = reactive<{ name: string, color: string, avatarBase64?: string }>({
    name: '',
    color: '#2980b9',
    avatarBase64: undefined,
  })
  const avatarFileInput = ref<HTMLInputElement | null>(null)

  function openAddPerson (): void {
    editingPerson.value = null
    personDraft.name = ''
    personDraft.color = PALETTE_COLORS[0]
    personDraft.avatarBase64 = undefined
    personDialogOpen.value = true
  }

  function openEditPerson (person: Person): void {
    editingPerson.value = person
    personDraft.name = person.name
    personDraft.color = person.color
    personDraft.avatarBase64 = person.avatarBase64
    personDialogOpen.value = true
  }

  function savePerson (): void {
    if (!personDraft.name.trim()) return
    const data = {
      name: personDraft.name.trim(),
      color: personDraft.color,
      avatarBase64: personDraft.avatarBase64,
    }
    if (editingPerson.value) {
      calendarStore.personUpdate(editingPerson.value.id, data)
    } else {
      calendarStore.personCreate(data)
    }
    personDialogOpen.value = false
  }

  function deletePerson (id: string): void {
    calendarStore.personRemove(id)
  }

  function triggerAvatarUpload (): void {
    avatarFileInput.value?.click()
  }

  function onAvatarUpload (e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener('load', event => {
      personDraft.avatarBase64 = event.target?.result as string
    })
    reader.readAsDataURL(file)
  }

  function exportData (): void {
    const data = {
      events: calendarStore.events,
      preferences: calendarStore.preferences,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `a-plan-export-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function doImportData (): void {
    importError.value = ''
    try {
      const parsed = JSON.parse(importJson.value)
      const events: CalendarEvent[] = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed.events)
          ? parsed.events
          : null)
      if (!events) throw new Error('Invalid format: expected an events array or exported JSON object')
      const preferences = parsed.preferences ?? null
      calendarStore.importData(events, preferences)
      importJson.value = ''
      importSuccess.value = true
    } catch (error) {
      importError.value = error instanceof Error ? error.message : 'Invalid JSON'
    }
  }
</script>

<style scoped>
.settings-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.settings-color-swatch:hover {
  transform: scale(1.15);
}

.settings-color-swatch--selected {
  border-color: rgba(0, 0, 0, 0.5);
  transform: scale(1.15);
  box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(0, 0, 0, 0.3);
}

.sleep-weekdays {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sleep-weekday-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 8px;
}

.sleep-weekday-times {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 36px;
}

.sleep-override-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.settings-dialog__body {
  min-height: 440px;
  max-height: 70vh;
  overflow: hidden;
}

.settings-dialog__tabs {
  width: 140px;
  flex-shrink: 0;
}

.settings-dialog__panel {
  flex: 1;
  overflow-y: auto;
}

.person-avatar-wrapper {
  position: relative;
  cursor: pointer;
  display: inline-block;
  flex-shrink: 0;
}

.person-avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.person-avatar-wrapper:hover .person-avatar-overlay {
  opacity: 1;
}
</style>
