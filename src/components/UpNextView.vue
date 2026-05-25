<template>
  <div class="up-next">
    <!-- Fullscreen timer overlay -->
    <TimeTimerDisplay
      v-if="showFullscreenTimer && nextTimerEvent"
      :date="selectedDate.value"
      :event="nextTimerEvent"
      :fullscreen="true"
      @complete="onTimerComplete"
    />

    <!-- Completion animation overlay -->
    <div v-if="showCompletionOverlay && completedEvent" class="up-next__completion-overlay">
      <v-icon
        v-if="completedEvent.iconLibrary === 'mdi'"
        class="up-next__completion-icon"
        color="white"
        :icon="completedEvent.icon"
        size="80"
      />

      <i
        v-else
        :class="`fas fa-${completedEvent.icon.replace('fa-', '')} up-next__completion-icon`"
        style="font-size: 5rem; color: white"
      />
    </div>

    <!-- Main content -->
    <div class="up-next__content-wrapper">
      <transition mode="out-in" :name="slideName">
        <div :key="selectedDate" class="up-next__content">
          <!-- Empty state: fills entire content area -->
          <template v-if="currentEvents.length === 0 && upcomingEvents.length === 0 && pinnedEvents.length === 0">
            <div class="up-next__empty">
              <v-icon class="up-next__empty-icon" color="rgba(0,0,0,0.2)" icon="mdi-check-circle-outline" />
              <div class="up-next__empty-text">Nothing scheduled</div>
            </div>
          </template>

          <template v-else>
            <!-- Live clock -->
            <div class="up-next__clock">
              <span class="up-next__clock-time">{{ clockTime }}</span>
              <span class="up-next__clock-ampm">{{ clockAmPm }}</span>
            </div>

            <!-- Pinned events -->
            <PinnedEventsStrip v-if="pinnedEvents.length > 0" :date="selectedDate.value" :events="pinnedEvents" />

            <!-- Current events -->
            <div v-if="currentEvents.length > 0" class="up-next__section">
              <div class="up-next__section-label">Happening now</div>

              <div
                v-for="event in currentEvents"
                :key="event.id"
                class="up-next__event-card up-next__event-card--current"
                :style="{ borderLeftColor: event.color }"
                @click="onEventClick(event)"
              >
                <div class="up-next__event-card__left">
                  <div class="up-next__event-icon-wrap" :style="{ backgroundColor: event.color }">
                    <v-icon
                      v-if="event.iconLibrary === 'mdi'"
                      color="white"
                      :icon="event.icon"
                      size="22"
                    />

                    <i
                      v-else
                      :class="`fas fa-${event.icon.replace('fa-', '')}`"
                      style="font-size: 1.2rem; color: white"
                    />
                  </div>

                  <div class="up-next__event-text">
                    <div v-if="event.title" class="up-next__event-title">{{ event.title }}</div>

                    <div class="up-next__event-time">
                      {{ formatDisplayTimeWithFormat(event.startTime, calendarStore.preferences.use24HourClock) }}
                      –
                      {{ formatDisplayTimeWithFormat(event.endTime, calendarStore.preferences.use24HourClock) }}
                    </div>
                  </div>
                </div>

                <TimeTimerDisplay
                  v-if="event.hasTimer"
                  :date="selectedDate.value"
                  :event="event"
                  @complete="onTimerComplete"
                />
              </div>
            </div>

            <!-- Upcoming events -->
            <div v-if="upcomingEvents.length > 0" class="up-next__section">
              <div class="up-next__section-label">{{ currentEvents.length > 0 ? 'Coming up' : 'Up next' }}</div>

              <div
                v-for="event in upcomingEvents"
                :key="event.id"
                class="up-next__event-card"
                :style="{ borderLeftColor: event.color }"
                @click="onEventClick(event)"
              >
                <div class="up-next__event-card__left">
                  <div class="up-next__event-icon-wrap" :style="{ backgroundColor: event.color }">
                    <v-icon
                      v-if="event.iconLibrary === 'mdi'"
                      color="white"
                      :icon="event.icon"
                      size="22"
                    />

                    <i
                      v-else
                      :class="`fas fa-${event.icon.replace('fa-', '')}`"
                      style="font-size: 1.2rem; color: white"
                    />
                  </div>

                  <div class="up-next__event-text">
                    <div v-if="event.title" class="up-next__event-title">{{ event.title }}</div>

                    <div class="up-next__event-time">
                      {{ formatDisplayTimeWithFormat(event.startTime, calendarStore.preferences.use24HourClock) }}
                      –
                      {{ formatDisplayTimeWithFormat(event.endTime, calendarStore.preferences.use24HourClock) }}
                    </div>
                  </div>
                </div>

                <v-icon
                  v-if="event.hasTimer"
                  class="mr-2"
                  :color="event.color"
                  icon="mdi-timer-outline"
                  size="18"
                />
              </div>
            </div>
          </template>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { getEventsForDate } from '@/composables/useRecurrence'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { formatDisplayTimeWithFormat } from '@/utils/dateUtils'

  const calendarStore = useCalendarStore()
  const appStore = useAppStore()

  const selectedDate = computed(() => calendarStore.preferences.selectedDate)

  const slideName = computed(() =>
    appStore.navigationDirection === 'forward' ? 'slide-left' : 'slide-right',
  )
  const now = ref(new Date())
  const showCompletionOverlay = ref(false)
  const completedEvent = ref<CalendarEvent | null>(null)

  let intervalId: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    intervalId = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onUnmounted(() => {
    if (intervalId !== null) clearInterval(intervalId)
  })

  const personFilter = computed(() => calendarStore.preferences.activePersonFilter)

  const todayEvents = computed(() => {
    const all = getEventsForDate(calendarStore.events, selectedDate.value).filter(e => !e.isAllDay)
    if (!personFilter.value) return all
    return all.filter(e => !e.personId || personFilter.value!.includes(e.personId))
  })

  function toMinutes (timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

  const pinnedEvents = computed(() => todayEvents.value.filter(e => e.isPinned))

  const currentEvents = computed(() =>
    todayEvents.value.filter(e =>
      toMinutes(e.startTime) <= nowMinutes.value && toMinutes(e.endTime) > nowMinutes.value,
    ),
  )

  const upcomingEvents = computed(() =>
    todayEvents.value
      .filter(e => toMinutes(e.startTime) > nowMinutes.value)
      .toSorted((a, b) => a.startTime.localeCompare(b.startTime)),
  )

  const nextTimerEvent = computed(() => upcomingEvents.value.find(e => e.hasTimer) ?? null)

  const showFullscreenTimer = computed(
    () => currentEvents.value.length === 0 && nextTimerEvent.value !== null,
  )

  // Clock display
  const use24h = computed(() => calendarStore.preferences.use24HourClock)

  const clockTime = computed(() => {
    const h = now.value.getHours()
    const m = String(now.value.getMinutes()).padStart(2, '0')
    if (use24h.value) return `${String(h).padStart(2, '0')}:${m}`
    const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h)
    return `${h12}:${m}`
  })

  const clockAmPm = computed(() => {
    if (use24h.value) return ''
    return now.value.getHours() < 12 ? 'AM' : 'PM'
  })

  function onEventClick (event: CalendarEvent): void {
    if (event.subtasks?.length) {
      appStore.taskViewOpen(event.id, selectedDate.value)
    } else {
      appStore.dialogEventOpen(event.id)
    }
  }

  function onTimerComplete (): void {
    const event = nextTimerEvent.value ?? currentEvents.value[0] ?? null
    if (!event) return
    completedEvent.value = event
    showCompletionOverlay.value = true
    setTimeout(() => {
      showCompletionOverlay.value = false
      completedEvent.value = null
    }, 2500)
  }
</script>

<style scoped>
.up-next {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.up-next__content-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.up-next__content {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.up-next__clock {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  padding: 32px 24px 20px;
  flex-shrink: 0;
}

.up-next__clock-time {
  font-size: 4rem;
  font-weight: 700;
  color: #2c3d55;
  line-height: 1;
  letter-spacing: -0.02em;
}

.up-next__clock-ampm {
  font-size: 1.4rem;
  font-weight: 500;
  color: rgba(44, 61, 85, 0.5);
  line-height: 1;
}

.up-next__section {
  padding: 0 16px 12px;
}

.up-next__section-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.35);
  padding: 8px 0 6px;
}

.up-next__event-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-left: 4px solid;
  border-radius: 0 4px 4px 0;
  background: rgba(0, 0, 0, 0.02);
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.up-next__event-card:hover {
  background: rgba(0, 0, 0, 0.05);
}

.up-next__event-card--current {
  background: rgba(0, 0, 0, 0.04);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.up-next__event-card__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.up-next__event-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.up-next__event-text {
  flex: 1;
  min-width: 0;
}

.up-next__event-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.up-next__event-time {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

.up-next__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  min-height: 0;
  container-type: size;
}

.up-next__empty-icon {
  font-size: 90cqh !important;
  width: 90cqh !important;
  height: 90cqh !important;
}

.up-next__empty-text {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.3);
  font-weight: 500;
}

/* Completion animation overlay */
.up-next__completion-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(44, 61, 85, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes icon-burst {
  0%   { transform: scale(0.5); opacity: 0; }
  20%  { transform: scale(1.2) rotate(-8deg); opacity: 1; }
  40%  { transform: scale(1.0) rotate(8deg); }
  55%  { transform: scale(1.15) rotate(-5deg); }
  70%  { transform: scale(1.05) rotate(3deg); }
  85%  { transform: scale(1.1) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.up-next__completion-icon {
  animation: icon-burst 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  font-size: 8rem !important;
  width: 8rem !important;
  height: 8rem !important;
}
</style>
