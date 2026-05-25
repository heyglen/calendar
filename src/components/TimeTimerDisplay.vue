<template>
  <div
    class="time-timer"
    :class="{ 'time-timer--fullscreen': fullscreen }"
    :style="fullscreen ? { backgroundColor: event.color + '22' } : {}"
  >
    <div class="time-timer__svg-wrap">
      <svg class="time-timer__svg" viewBox="0 0 100 100">
        <!-- Background track -->
        <circle
          class="time-timer__track"
          cx="50"
          cy="50"
          r="44"
        />

        <!-- Remaining arc — counter-clockwise using scaleX(-1) on arc -->
        <circle
          class="time-timer__arc"
          cx="50"
          cy="50"
          r="44"
          :stroke="event.color"
          :style="arcStyle"
        />
      </svg>

      <!-- Icon centered over SVG -->
      <div class="time-timer__icon-center">
        <v-icon
          v-if="event.iconLibrary === 'mdi'"
          :class="{ 'time-timer__icon--complete': isComplete }"
          :color="isComplete ? 'white' : event.color"
          :icon="event.icon"
          :size="fullscreen ? 64 : 36"
        />

        <i
          v-else
          :class="`fas fa-${event.icon.replace('fa-', '')} ${isComplete ? 'time-timer__icon--complete' : ''}`"
          :style="{
            color: isComplete ? 'white' : event.color,
            fontSize: fullscreen ? '4rem' : '2rem',
          }"
        />
      </div>
    </div>

    <!-- Time remaining label -->
    <div v-if="!isComplete" class="time-timer__label" :style="fullscreen ? { fontSize: '1.4rem' } : {}">
      {{ timeRemainingLabel }}
    </div>

    <div v-else class="time-timer__label time-timer__label--complete">
      Time's up!
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { parseLocalDate } from '@/utils/dateUtils'

  const props = defineProps<{
    event: CalendarEvent
    date: string
    fullscreen?: boolean
  }>()

  const emit = defineEmits<{
    complete: []
  }>()

  const CIRCUMFERENCE = 2 * Math.PI * 44

  const now = ref(new Date())
  let intervalId: ReturnType<typeof setInterval> | null = null
  let completeFired = false

  function getEventStart (): Date {
    const base = parseLocalDate(props.date)
    const [h, m] = props.event.startTime.split(':').map(Number)
    base.setHours(h, m, 0, 0)
    return base
  }

  function getEventEnd (): Date {
    const base = parseLocalDate(props.date)
    const [h, m] = props.event.endTime.split(':').map(Number)
    base.setHours(h, m, 0, 0)
    return base
  }

  const totalSeconds = computed(() => {
    const diff = getEventEnd().getTime() - getEventStart().getTime()
    return Math.max(1, diff / 1000)
  })

  const elapsedSeconds = computed(() => {
    const diff = now.value.getTime() - getEventStart().getTime()
    return Math.max(0, Math.min(totalSeconds.value, diff / 1000))
  })

  const fractionRemaining = computed(() =>
    Math.max(0, 1 - elapsedSeconds.value / totalSeconds.value),
  )

  const isComplete = computed(() => fractionRemaining.value <= 0)

  const arcStyle = computed(() => {
    const offset = CIRCUMFERENCE * (1 - fractionRemaining.value)
    return {
      strokeDasharray: `${CIRCUMFERENCE}`,
      strokeDashoffset: `${offset}`,
      // Start arc at top, shrink counter-clockwise
      transform: 'rotate(-90deg) scaleX(-1)',
      transformOrigin: '50px 50px',
    }
  })

  const timeRemainingLabel = computed(() => {
    const secs = Math.ceil(fractionRemaining.value * totalSeconds.value)
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  })

  onMounted(() => {
    intervalId = setInterval(() => {
      now.value = new Date()
      if (isComplete.value && !completeFired) {
        completeFired = true
        emit('complete')
      }
    }, 1000)
  })

  onUnmounted(() => {
    if (intervalId !== null) clearInterval(intervalId)
  })
</script>

<style scoped>
.time-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.time-timer--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 50;
  justify-content: center;
  padding: 24px;
}

.time-timer__svg-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-timer__svg {
  width: 120px;
  height: 120px;
}

.time-timer--fullscreen .time-timer__svg {
  width: min(70vw, 70vh);
  height: min(70vw, 70vh);
}

.time-timer__track {
  fill: none;
  stroke: rgba(0, 0, 0, 0.08);
  stroke-width: 12;
}

.time-timer__arc {
  fill: none;
  stroke-width: 12;
  stroke-linecap: butt;
  transition: stroke-dashoffset 0.9s linear;
}

.time-timer__icon-center {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-timer__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  letter-spacing: 0.02em;
}

.time-timer__label--complete {
  color: rgba(0, 0, 0, 0.7);
  font-size: 1rem;
}

@keyframes icon-complete {
  0%   { transform: scale(1) rotate(0deg); }
  25%  { transform: scale(4) rotate(-8deg); }
  45%  { transform: scale(7) rotate(8deg); }
  65%  { transform: scale(10) rotate(-4deg); }
  80%  { transform: scale(12) rotate(4deg); }
  100% { transform: scale(15) rotate(0deg); }
}

.time-timer__icon--complete {
  animation: icon-complete 1.5s ease-out forwards;
  transform-origin: center;
}
</style>
