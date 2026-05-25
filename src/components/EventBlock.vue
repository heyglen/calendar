<template>
  <div
    ref="blockEl"
    class="event-block"
    :class="{ 'event-block--show-titles': calendarStore.preferences.showEventTitles }"
    draggable="true"
    :style="blockStyle"
    :title="event.title || undefined"
    @click.stop="handleClick"
    @dragend="onDragEnd"
    @dragstart="onDragStart"
  >
    <div class="event-block__icon-wrapper">
      <v-icon
        v-if="event.iconLibrary === 'mdi'"
        class="event-block__icon"
        color="white"
        :icon="event.icon"
      />

      <i
        v-else
        :class="`fas fa-${event.icon.replace('fa-', '')} event-block__fa-icon`"
      />
    </div>

    <span v-if="event.title" class="event-block__title" :style="{ fontSize: titleFontSize }">{{ event.title }}</span>
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, ref } from 'vue'
  import { dragState } from '@/composables/useDragDrop'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'

  function computeTitleFontSize (title: string | undefined): string {
    const len = title?.length ?? 0
    if (len <= 8) return '0.85rem'
    if (len <= 16) return '0.72rem'
    if (len <= 24) return '0.62rem'
    return '0.52rem'
  }

  const props = defineProps<{
    event: CalendarEvent
    column: number
    totalColumns: number
    date?: string
  }>()

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()
  const blockEl = ref<HTMLElement | null>(null)

  const titleFontSize = computed(() => computeTitleFontSize(props.event.title))

  const blockStyle = computed(() => ({
    backgroundColor: props.event.color,
    width: `calc(${100 / props.totalColumns}% - 4px)`,
    left: `calc(${(props.column / props.totalColumns) * 100}% + 2px)`,
  }))

  function handleClick (): void {
    if (props.event.subtasks?.length && props.date) {
      appStore.taskViewOpen(props.event.id, props.date)
    } else {
      appStore.dialogEventOpen(props.event.id)
    }
  }

  function onDragStart (e: DragEvent): void {
    const el = blockEl.value
    if (!el) return
    const [sh, sm] = props.event.startTime.split(':').map(Number)
    const [eh, em] = props.event.endTime.split(':').map(Number)
    const durationMinutes = (eh * 60 + em) - (sh * 60 + sm)
    const grabOffset = el.offsetHeight > 0
      ? Math.round((e.offsetY / el.offsetHeight) * durationMinutes / 15) * 15
      : 0
    dragState.eventId = props.event.id
    dragState.grabOffsetMinutes = grabOffset
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', props.event.id)
    }
  }

  function onDragEnd (): void {
    dragState.eventId = null
    dragState.grabOffsetMinutes = 0
  }
</script>

<style scoped>
.event-block {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  overflow: hidden;
  transition: filter 0.15s ease, transform 0.15s ease;
  min-height: 60px;
}

.event-block:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.event-block[draggable='true'] {
  cursor: grab;
}

.event-block[draggable='true']:active {
  cursor: grabbing;
}

.event-block__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  container-type: size;
}

.event-block__icon {
  font-size: min(90cqh, 2rem) !important;
  width: min(90cqh, 2rem);
  height: min(90cqh, 2rem);
}

.event-block__fa-icon {
  font-size: min(90cqh, 1.8rem);
  color: white;
}

/* Title hidden by default, shown on hover or when show-titles class is present */
.event-block__title {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.15s ease, opacity 0.15s ease;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.event-block:hover .event-block__title,
.event-block--show-titles .event-block__title {
  max-height: 1.4em;
  opacity: 1;
}
</style>
