<template>
  <div class="app-time-field" :style="style">
    <v-select
      density="compact"
      hide-details
      :items="hourItems"
      :label="label"
      :model-value="selectedHour"
      variant="outlined"
      @update:model-value="onHourChange"
    />

    <span class="app-time-field__sep">:</span>

    <v-select
      density="compact"
      hide-details
      :items="minuteItems"
      label=" "
      :model-value="selectedMinute"
      variant="outlined"
      @update:model-value="onMinuteChange"
    />

    <template v-if="!use24HourClock">
      <v-btn-toggle
        color="primary"
        density="compact"
        :model-value="period"
        variant="outlined"
        @update:model-value="onPeriodChange"
      >
        <v-btn size="small" value="AM">AM</v-btn>
        <v-btn size="small" value="PM">PM</v-btn>
      </v-btn-toggle>
    </template>

    <v-btn
      v-if="clearable && modelValue"
      density="compact"
      icon="mdi-close"
      size="small"
      variant="text"
      @click="emit('clear')"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  const props = withDefaults(defineProps<{
    modelValue: string
    use24HourClock?: boolean
    label?: string
    clearable?: boolean
    style?: string | Record<string, string>
  }>(), {
    use24HourClock: true,
    label: '',
    clearable: false,
    style: undefined,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    'clear': []
  }>()

  const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  const minuteItems = MINUTES.map(m => ({ title: m, value: m }))

  const hourItems = computed(() => {
    if (props.use24HourClock) {
      return Array.from({ length: 24 }, (_, i) => ({
        title: String(i).padStart(2, '0'),
        value: String(i).padStart(2, '0'),
      }))
    }
    return Array.from({ length: 12 }, (_, i) => {
      const h = i === 0 ? 12 : i
      return { title: String(h), value: String(h) }
    })
  })

  function parsedTime (): { h: number, m: number } {
    const [hStr, mStr] = (props.modelValue || '00:00').split(':')
    return { h: Number(hStr) || 0, m: Number(mStr) || 0 }
  }

  const period = computed<'AM' | 'PM'>(() => {
    return parsedTime().h < 12 ? 'AM' : 'PM'
  })

  const selectedHour = computed<string>(() => {
    const h = parsedTime().h
    if (props.use24HourClock) return String(h).padStart(2, '0')
    const h12 = h % 12 === 0 ? 12 : h % 12
    return String(h12)
  })

  const selectedMinute = computed<string>(() => {
    const m = parsedTime().m
    // Snap to nearest 5-minute interval
    const snapped = Math.round(m / 5) * 5
    return String(Math.min(snapped, 55)).padStart(2, '0')
  })

  function emit24 (h: number, m: number): void {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    emit('update:modelValue', `${hh}:${mm}`)
  }

  function onHourChange (val: string): void {
    const m = parsedTime().m
    if (props.use24HourClock) {
      emit24(Number(val), m)
    } else {
      const h12 = Number(val)
      const p = period.value
      let h24 = h12 % 12 + (p === 'PM' ? 12 : 0)
      if (h24 === 24) h24 = 12
      if (h24 === 12 && p === 'AM') h24 = 0
      emit24(h24, m)
    }
  }

  function onMinuteChange (val: string): void {
    const h = parsedTime().h
    emit24(h, Number(val))
  }

  function onPeriodChange (val: 'AM' | 'PM'): void {
    const { h, m } = parsedTime()
    const h12 = h % 12
    const h24 = val === 'PM' ? h12 + 12 : h12
    emit24(h24 === 24 ? 12 : h24, m)
  }
</script>

<style scoped>
.app-time-field {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-time-field__sep {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}
</style>
