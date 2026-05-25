<template>
  <div class="event-form-fields">
    <!-- Icon + color preview -->
    <div class="event-form-fields__icon-row mb-4">
      <div
        ref="iconPreviewRef"
        class="event-form-fields__icon-preview"
        style="cursor: pointer"
        :style="{ backgroundColor: modelValue.color }"
        tabindex="0"
        title="Click to change icon and color"
        @click="iconPickerOpen = true"
        @keydown.enter.space.prevent="iconPickerOpen = true"
      >
        <v-icon v-if="modelValue.iconLibrary === 'mdi'" color="white" :icon="modelValue.icon" size="40" />
        <i v-else :class="`fas fa-${modelValue.icon.replace('fa-', '')}`" style="font-size: 2rem; color: white" />
      </div>
    </div>

    <!-- Date -->
    <v-text-field
      class="mb-3"
      density="compact"
      hide-details
      label="Date"
      :model-value="modelValue.startDate"
      prepend-inner-icon="mdi-calendar"
      type="date"
      variant="outlined"
      @update:model-value="updateField('startDate', $event)"
    />

    <!-- Time range (hidden when all day) -->
    <div v-if="!modelValue.isAllDay" class="mb-3">
      <div class="event-form-fields__time-row">
        <AppTimeField
          label="Start time"
          :model-value="modelValue.startTime"
          style="flex: 1"
          :use24-hour-clock="calendarStore.preferences.use24HourClock"
          @update:model-value="updateField('startTime', $event)"
        />

        <span class="event-form-fields__time-separator text-medium-emphasis">–</span>

        <AppTimeField
          label="End time"
          :model-value="modelValue.endTime"
          style="flex: 1"
          :use24-hour-clock="calendarStore.preferences.use24HourClock"
          @update:model-value="updateField('endTime', $event)"
        />
      </div>

      <div v-if="sleepTimeError" class="text-caption text-error mt-1">
        <v-icon size="14">mdi-sleep</v-icon>
        {{ sleepTimeError }}
      </div>
    </div>

    <!-- Title -->
    <v-text-field
      class="mb-3"
      density="compact"
      hide-details
      label="Title (optional)"
      :model-value="modelValue.title"
      prepend-inner-icon="mdi-text"
      variant="outlined"
      @update:model-value="updateField('title', $event)"
    />

    <!-- Advanced toggle -->
    <button class="event-form-fields__advanced-toggle mb-2" type="button" @click="showAdvanced = !showAdvanced">
      <v-icon :icon="showAdvanced ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="16" />
      {{ showAdvanced ? 'Hide advanced' : 'Show advanced' }}
    </button>

    <!-- Advanced section -->
    <div v-if="showAdvanced" class="event-form-fields__advanced">
      <!-- All day toggle -->
      <div class="event-form-fields__toggle-row mb-3">
        <span class="text-body-2">All day</span>

        <v-switch
          color="primary"
          density="compact"
          hide-details
          :model-value="modelValue.isAllDay ?? false"
          @update:model-value="onAllDayChange"
        />
      </div>

      <!-- End date (for multi-day all-day events) -->
      <v-text-field
        v-if="modelValue.isAllDay"
        class="mb-3"
        density="compact"
        hide-details
        label="End date (optional)"
        :model-value="modelValue.endDate ?? ''"
        prepend-inner-icon="mdi-calendar"
        type="date"
        variant="outlined"
        @update:model-value="updateField('endDate', $event || undefined)"
      />

      <!-- Pin to top toggle -->
      <div class="event-form-fields__toggle-row mb-3">
        <div>
          <div class="text-body-2">Pin to top</div>
          <div class="text-caption text-medium-emphasis">Keep at the top of the schedule</div>
        </div>

        <v-switch
          color="primary"
          density="compact"
          hide-details
          :model-value="modelValue.isPinned ?? false"
          @update:model-value="updateField('isPinned', !!$event)"
        />
      </div>

      <!-- Hide from month view toggle -->
      <div class="event-form-fields__toggle-row mb-3">
        <div>
          <div class="text-body-2">Hide from month view</div>
          <div class="text-caption text-medium-emphasis">Don't show this event in the month calendar</div>
        </div>

        <v-switch
          color="primary"
          density="compact"
          hide-details
          :model-value="modelValue.hideFromMonthView ?? false"
          @update:model-value="updateField('hideFromMonthView', !!$event)"
        />
      </div>

      <!-- Countdown toggle (only for all-day events) -->
      <div v-if="modelValue.isAllDay" class="event-form-fields__toggle-row mb-3">
        <div>
          <div class="text-body-2">Show countdown</div>
          <div class="text-caption text-medium-emphasis">Show "X days until…" banner</div>
        </div>

        <v-switch
          color="primary"
          density="compact"
          hide-details
          :model-value="modelValue.showCountdown ?? false"
          @update:model-value="updateField('showCountdown', !!$event)"
        />
      </div>

      <!-- Countdown timer toggle (only for timed events) -->
      <div v-if="!modelValue.isAllDay" class="event-form-fields__toggle-row mb-3">
        <div>
          <div class="text-body-2">Countdown timer</div>
          <div class="text-caption text-medium-emphasis">Show circular timer in Up Next view</div>
        </div>

        <v-switch
          color="primary"
          density="compact"
          hide-details
          :model-value="modelValue.hasTimer ?? false"
          @update:model-value="updateField('hasTimer', !!$event)"
        />
      </div>

      <!-- Person selector -->
      <v-select
        v-if="calendarStore.preferences.people.length > 0"
        class="mb-3"
        clearable
        density="compact"
        hide-details
        :items="personItems"
        label="Person (optional)"
        :model-value="modelValue.personId ?? null"
        variant="outlined"
        @update:model-value="updateField('personId', $event ?? undefined)"
      />

      <v-divider class="my-3" />

      <!-- Repeat -->
      <RecurrenceSelector
        :model-value="modelValue.recurrence"
        @update:model-value="updateField('recurrence', $event)"
      />

      <v-divider class="my-3" />

      <!-- Steps -->
      <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Steps</div>

      <SubTaskEditor
        :icon-bg="modelValue.color"
        :model-value="modelValue.subtasks ?? []"
        @update:model-value="updateField('subtasks', $event)"
      />
    </div>

    <IconPickerDialog
      v-model="iconPickerOpen"
      :selected-color="modelValue.color"
      :selected-key="modelValue.icon"
      @select:icon="onIconSelected"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { IconDescriptor } from '@/data/iconLibrary'
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, ref } from 'vue'
  import { useCalendarStore } from '@/stores/calendar'

  const iconPreviewRef = ref<HTMLElement | null>(null)

  function focusIconPreview (): void {
    iconPreviewRef.value?.focus()
  }

  function toggleAdvanced (): void {
    showAdvanced.value = !showAdvanced.value
  }

  defineExpose({ focusIconPreview, toggleAdvanced })

  type EventDraft = Omit<CalendarEvent, 'id'>

  const props = defineProps<{
    modelValue: EventDraft
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: EventDraft]
  }>()

  const calendarStore = useCalendarStore()
  const iconPickerOpen = ref(false)
  const showAdvanced = ref(false)

  const personItems = computed(() =>
    calendarStore.preferences.people.map(p => ({ title: p.name, value: p.id })),
  )

  function timeToMinutes (time: string): number {
    const [h, m] = (time || '00:00').split(':').map(Number)
    return h * 60 + m
  }

  function formatTimePref (time: string): string {
    const [h, m] = time.split(':').map(Number)
    if (calendarStore.preferences.use24HourClock) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    const period = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }

  const sleepTimeError = computed<string | null>(() => {
    if (props.modelValue.isAllDay) return null
    const { start, end } = calendarStore.getSleepTimesForDate(props.modelValue.startDate)
    if (!start || !end) return null
    const s = timeToMinutes(start)
    const e = timeToMinutes(end)
    const t = timeToMinutes(props.modelValue.startTime)
    const inSleep = s > e ? (t >= s || t < e) : (t >= s && t < e)
    if (!inSleep) return null
    return `Can't schedule during sleep time (${formatTimePref(start)}–${formatTimePref(end)})`
  })

  function updateField<Key extends keyof EventDraft> (field: Key, value: EventDraft[Key]): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
  }

  function onAllDayChange (value: boolean | null): void {
    emit('update:modelValue', {
      ...props.modelValue,
      isAllDay: !!value,
      startTime: value ? '00:00' : props.modelValue.startTime,
      endTime: value ? '23:59' : props.modelValue.endTime,
      showCountdown: value ? (props.modelValue.showCountdown ?? false) : undefined,
    })
  }

  function onIconSelected (descriptor: IconDescriptor, color: string): void {
    emit('update:modelValue', {
      ...props.modelValue,
      icon: descriptor.key,
      iconLibrary: descriptor.library,
      color,
    })
  }
</script>

<style scoped>
.event-form-fields__icon-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.event-form-fields__icon-preview {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.event-form-fields__icon-preview:hover {
  filter: brightness(1.12);
  transform: scale(1.05);
}

.event-form-fields__icon-preview:focus-visible {
  outline: 3px solid rgba(var(--v-theme-primary), 0.8);
  outline-offset: 3px;
}

.event-form-fields__time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-form-fields__time-separator {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.event-form-fields__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-form-fields__advanced-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.15s;
}

.event-form-fields__advanced-toggle:hover {
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.event-form-fields__advanced {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 12px;
  margin-top: 4px;
}
</style>
