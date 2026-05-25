import type { CalendarEvent } from '@/types/calendar'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const dialogEventIsOpen = ref(false)
  const dialogEventEditingId = ref<string | null>(null)
  const newEventDefaultTime = ref<string | null>(null)
  const selectedHour = ref<number | null>(null)
  const selectedWeekColumn = ref<number | null>(null)
  const settingsDialogOpen = ref(false)
  const settingsInitialTab = ref<string | null>(null)
  const helpDialogOpen = ref(false)
  const altKeyHeld = ref(false)
  const previewEvent = ref<(Omit<CalendarEvent, 'id'> & { id: '__preview__', isPreview: true }) | null>(null)

  // Task view
  const taskViewEventId = ref<string | null>(null)
  const taskViewDate = ref<string | null>(null)

  // Subtask completion: key = `${eventId}_${date}`, value = Set of completed subtask IDs
  const taskCompletions = ref(new Map<string, Set<string>>())
  // Undo history: most recent completion last
  const taskCompletionHistory = ref<Array<{ key: string, subtaskId: string }>>([])

  const taskViewIsOpen = ref(false)

  const navigationDirection = ref<'forward' | 'backward'>('forward')
  const viewTransitionName = ref<'zoom-out' | 'zoom-in'>('zoom-in')

  function setNavigationDirection (dir: 'forward' | 'backward'): void {
    navigationDirection.value = dir
  }

  function setViewTransitionName (name: 'zoom-out' | 'zoom-in'): void {
    viewTransitionName.value = name
  }

  function dialogEventOpen (editingId: string | null = null, defaultTime?: string): void {
    dialogEventEditingId.value = editingId
    newEventDefaultTime.value = defaultTime ?? null
    dialogEventIsOpen.value = true
  }

  function dialogEventClose (): void {
    dialogEventIsOpen.value = false
    dialogEventEditingId.value = null
    newEventDefaultTime.value = null
  }

  function setSelectedHour (hour: number | null): void {
    selectedHour.value = hour
  }

  function setSelectedWeekColumn (col: number | null): void {
    selectedWeekColumn.value = col
  }

  function settingsDialogToggle (): void {
    settingsDialogOpen.value = !settingsDialogOpen.value
  }

  function helpDialogToggle (): void {
    helpDialogOpen.value = !helpDialogOpen.value
  }

  function setPreviewEvent (event: Omit<CalendarEvent, 'id'> & { id: '__preview__', isPreview: true }): void {
    previewEvent.value = event
  }

  function clearPreviewEvent (): void {
    previewEvent.value = null
  }

  function taskViewOpen (eventId: string, date: string): void {
    taskViewEventId.value = eventId
    taskViewDate.value = date
    taskViewIsOpen.value = true
  }

  function taskViewClose (): void {
    taskViewIsOpen.value = false
    taskViewEventId.value = null
    taskViewDate.value = null
  }

  function getCompletedSubTasks (eventId: string, date: string): Set<string> {
    const key = `${eventId}_${date}`
    return taskCompletions.value.get(key) ?? new Set()
  }

  function completeSubTask (eventId: string, date: string, subtaskId: string): void {
    const key = `${eventId}_${date}`
    const existing = taskCompletions.value.get(key) ?? new Set()
    const updated = new Set(existing)
    updated.add(subtaskId)
    taskCompletions.value.set(key, updated)
    taskCompletionHistory.value.push({ key, subtaskId })
  }

  function undoLastSubTask (): void {
    const last = taskCompletionHistory.value.pop()
    if (!last) {
      return
    }
    const existing = taskCompletions.value.get(last.key)
    if (!existing) {
      return
    }
    const updated = new Set(existing)
    updated.delete(last.subtaskId)
    taskCompletions.value.set(last.key, updated)
  }

  return {
    dialogEventIsOpen,
    dialogEventEditingId,
    newEventDefaultTime,
    selectedHour,
    selectedWeekColumn,
    settingsDialogOpen,
    settingsInitialTab,
    helpDialogOpen,
    altKeyHeld,
    previewEvent,
    taskViewIsOpen,
    taskViewEventId,
    taskViewDate,
    taskCompletionHistory,
    navigationDirection,
    viewTransitionName,
    setNavigationDirection,
    setViewTransitionName,
    dialogEventOpen,
    dialogEventClose,
    setSelectedHour,
    setSelectedWeekColumn,
    settingsDialogToggle,
    helpDialogToggle,
    setPreviewEvent,
    clearPreviewEvent,
    taskViewOpen,
    taskViewClose,
    getCompletedSubTasks,
    completeSubTask,
    undoLastSubTask,
  }
})
