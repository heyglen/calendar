<template>
  <div class="recurrence-selector">
    <div class="recurrence-selector__label text-caption text-medium-emphasis mb-2">Repeat</div>

    <v-menu v-model="menuOpen" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          append-icon="mdi-chevron-down"
          color="secondary"
          prepend-icon="mdi-repeat"
          variant="tonal"
        >
          {{ currentLabel }}
        </v-btn>
      </template>

      <v-list density="compact">
        <v-list-item
          v-for="opt in RECURRENCE_OPTIONS"
          :key="opt.value"
          :active="modelValue.type === opt.value"
          active-color="primary"
          :title="opt.label"
          @click="selectOption(opt.value)"
        />
      </v-list>
    </v-menu>

    <div v-if="modelValue.type === 'monthly-ordinal'" class="recurrence-selector__ordinal mt-3">
      <div class="recurrence-selector__ordinal-row">
        <v-select
          class="recurrence-selector__select"
          density="compact"
          hide-details
          :items="ordinalPositionOptions"
          label="Position"
          :model-value="modelValue.ordinalPosition"
          variant="outlined"
          @update:model-value="onOrdinalPositionChange"
        />

        <v-select
          class="recurrence-selector__select"
          density="compact"
          hide-details
          :items="weekdayOptions"
          label="Weekday"
          :model-value="modelValue.ordinalWeekday"
          variant="outlined"
          @update:model-value="onOrdinalWeekdayChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { OrdinalPosition, RecurrenceRule, WeekdayNumber } from '@/types/calendar'
  import { computed, ref } from 'vue'

  const props = defineProps<{
    modelValue: RecurrenceRule
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: RecurrenceRule]
  }>()

  const menuOpen = ref(false)

  const RECURRENCE_OPTIONS = [
    { value: 'none', label: 'No repeat' },
    { value: 'daily', label: 'Every day' },
    { value: 'weekly', label: 'Every week' },
    { value: 'yearly', label: 'Every year' },
    { value: 'monthly-ordinal', label: 'Day of month' },
  ] as const

  const currentLabel = computed(() =>
    RECURRENCE_OPTIONS.find(o => o.value === props.modelValue.type)?.label ?? 'No repeat',
  )

  const ordinalPositionOptions = [
    { title: '1st', value: 1 },
    { title: '2nd', value: 2 },
    { title: '3rd', value: 3 },
    { title: '4th', value: 4 },
    { title: 'Last', value: 'last' },
  ]

  const weekdayOptions = [
    { title: 'Sunday', value: 0 },
    { title: 'Monday', value: 1 },
    { title: 'Tuesday', value: 2 },
    { title: 'Wednesday', value: 3 },
    { title: 'Thursday', value: 4 },
    { title: 'Friday', value: 5 },
    { title: 'Saturday', value: 6 },
  ]

  function selectOption (type: string): void {
    onTypeChange(type)
    if (type !== 'monthly-ordinal') menuOpen.value = false
  }

  function onTypeChange (type: string): void {
    const updatedRule: RecurrenceRule = { type: type as RecurrenceRule['type'] }
    if (type === 'monthly-ordinal') {
      updatedRule.ordinalPosition = props.modelValue.ordinalPosition ?? 1
      updatedRule.ordinalWeekday = props.modelValue.ordinalWeekday ?? 1
    }
    emit('update:modelValue', updatedRule)
  }

  function onOrdinalPositionChange (position: OrdinalPosition): void {
    emit('update:modelValue', { ...props.modelValue, ordinalPosition: position })
  }

  function onOrdinalWeekdayChange (weekday: WeekdayNumber): void {
    emit('update:modelValue', { ...props.modelValue, ordinalWeekday: weekday })
  }
</script>

<style scoped>
.recurrence-selector__ordinal-row {
  display: flex;
  gap: 12px;
}

.recurrence-selector__select {
  flex: 1;
}
</style>
