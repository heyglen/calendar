<template>
  <v-dialog
    max-width="480"
    :model-value="appStore.dialogEventIsOpen"
    :scrim="true"
    scrollable
    @after-enter="formFieldsRef?.focusIconPreview()"
    @update:model-value="onDialogToggle"
  >
    <v-card ref="cardRef" @keydown="onDialogKeyDown">
      <v-card-title
        class="pa-4 pb-0 d-flex align-center event-dialog__drag-handle"
        @mousedown="startDrag"
      >
        <span class="text-h6">{{ isEditing ? 'Edit Event' : 'Add Event' }}</span>
        <v-spacer />
        <v-btn density="compact" icon="mdi-close" variant="text" @click="appStore.dialogEventClose()" />
      </v-card-title>

      <v-card-text class="pa-4">
        <EventFormFields ref="formFieldsRef" v-model="eventDraft" />
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-btn
          v-if="isEditing"
          color="error"
          prepend-icon="mdi-delete-outline"
          variant="text"
          @click="deleteConfirmOpen = true"
        >
          Delete
        </v-btn>

        <v-spacer />
        <v-btn variant="text" @click="appStore.dialogEventClose()">Cancel</v-btn>

        <v-btn
          color="primary"
          :disabled="!isDraftValid"
          variant="flat"
          @click="saveEvent"
        >
          {{ isEditing ? 'Save' : 'Add' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <DeleteConfirmDialog
      v-model="deleteConfirmOpen"
      :is-recurring="eventDraft.recurrence.type !== 'none'"
      @confirm="deleteEvent"
    />
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { CalendarEvent } from '@/types/calendar'
  import { computed, ref, watch, watchEffect } from 'vue'
  import { DEFAULT_EVENT_DURATION_HOURS, DEFAULT_START_TIME } from '@/constants'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'
  import { getWeekdayNumber, today } from '@/utils/dateUtils'

  type EventDraft = Omit<CalendarEvent, 'id'>

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()

  const deleteConfirmOpen = ref(false)
  const cardRef = ref<{ $el: HTMLElement } | null>(null)
  const formFieldsRef = ref<{ focusIconPreview: () => void, toggleAdvanced: () => void } | null>(null)

  // Drag state
  const isDragging = ref(false)
  let dragStartX = 0
  let dragStartY = 0
  let dragOffsetX = 0
  let dragOffsetY = 0
  let currentX = 0
  let currentY = 0

  function getOverlayContent (): HTMLElement | null {
    return (cardRef.value?.$el?.parentElement as HTMLElement) ?? null
  }

  function startDrag (e: MouseEvent): void {
    const overlay = getOverlayContent()
    if (!overlay) return
    isDragging.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragOffsetX = currentX
    dragOffsetY = currentY
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
    e.preventDefault()
  }

  function onDrag (e: MouseEvent): void {
    if (!isDragging.value) return
    currentX = dragOffsetX + (e.clientX - dragStartX)
    currentY = dragOffsetY + (e.clientY - dragStartY)
    const overlay = getOverlayContent()
    if (overlay) {
      overlay.style.transform = `translate(${currentX}px, ${currentY}px)`
    }
  }

  function stopDrag (): void {
    isDragging.value = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
  }

  function resetDragPosition (): void {
    currentX = 0
    currentY = 0
    const overlay = getOverlayContent()
    if (overlay) {
      overlay.style.transform = ''
    }
  }

  function buildDefaultDraft (): EventDraft {
    const startTime = appStore.newEventDefaultTime ?? DEFAULT_START_TIME
    const [h, m] = startTime.split(':').map(Number)
    const endHour = Math.min(h + DEFAULT_EVENT_DURATION_HOURS, 23)
    const endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return {
      title: '',
      icon: 'mdi-star',
      iconLibrary: 'mdi',
      color: '#2980b9',
      startDate: calendarStore.preferences.selectedDate || today(),
      startTime,
      endTime,
      recurrence: { type: 'none' },
      subtasks: [],
    }
  }

  function buildDraftFromEvent (event: CalendarEvent): EventDraft {
    const { id: _id, ...draftFields } = event
    return { ...draftFields }
  }

  const eventDraft = ref<EventDraft>(buildDefaultDraft())

  const isEditing = computed(() => appStore.dialogEventEditingId !== null)

  const isDraftValid = computed(() =>
    eventDraft.value.isAllDay || eventDraft.value.startTime < eventDraft.value.endTime,
  )

  watchEffect(() => {
    if (appStore.dialogEventIsOpen) {
      appStore.setPreviewEvent({ ...eventDraft.value, id: '__preview__', isPreview: true })
    } else {
      appStore.clearPreviewEvent()
    }
  })

  watch(
    () => appStore.dialogEventIsOpen,
    isOpen => {
      if (!isOpen) {
        resetDragPosition()
        return
      }
      const editingId = appStore.dialogEventEditingId
      if (editingId) {
        const existingEvent = calendarStore.calendarEventFindById(editingId)
        eventDraft.value = existingEvent
          ? buildDraftFromEvent(existingEvent)
          : buildDefaultDraft()
      } else {
        eventDraft.value = buildDefaultDraft()
      }
    },
  )

  watch(
    () => eventDraft.value.recurrence.type,
    recurrenceType => {
      if (recurrenceType === 'weekly') {
        eventDraft.value.recurrence = {
          type: 'weekly',
          weekday: getWeekdayNumber(eventDraft.value.startDate),
        }
      }
    },
  )

  function onDialogToggle (isOpen: boolean): void {
    if (!isOpen) appStore.dialogEventClose()
  }

  function saveEvent (): void {
    if (!isDraftValid.value) return
    const editingId = appStore.dialogEventEditingId
    if (editingId) {
      calendarStore.calendarEventUpdate(editingId, eventDraft.value)
    } else {
      calendarStore.calendarEventCreate(eventDraft.value)
    }
    appStore.dialogEventClose()
  }

  function onDialogKeyDown (e: KeyboardEvent): void {
    if (e.altKey && e.key === 's') {
      e.preventDefault()
      saveEvent()
    } else if (e.altKey && e.key === 'a') {
      e.preventDefault()
      formFieldsRef.value?.toggleAdvanced()
    }
  }

  function deleteEvent (): void {
    const editingId = appStore.dialogEventEditingId
    if (editingId) {
      calendarStore.calendarEventRemove(editingId)
    }
    appStore.dialogEventClose()
  }
</script>

<style scoped>
.event-dialog__drag-handle {
  cursor: grab;
  user-select: none;
}

.event-dialog__drag-handle:active {
  cursor: grabbing;
}

</style>
