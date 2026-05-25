<template>
  <v-dialog
    fullscreen
    :model-value="appStore.taskViewIsOpen"
    transition="dialog-bottom-transition"
    @update:model-value="v => { if (!v) appStore.taskViewClose() }"
  >
    <v-card v-if="event" class="task-view d-flex flex-column" style="height: 100%">
      <!-- Header -->
      <div class="task-view__header" :style="{ backgroundColor: event.color }">
        <v-btn
          color="white"
          density="compact"
          icon="mdi-arrow-left"
          variant="text"
          @click="appStore.taskViewClose()"
        />

        <div class="task-view__header-info">
          <div class="task-view__event-icon">
            <v-icon v-if="event.iconLibrary === 'mdi'" color="white" :icon="event.icon" size="40" />
            <i v-else :class="`fas fa-${event.icon.replace('fa-', '')}`" style="font-size: 2.2rem; color: white" />
          </div>

          <div class="task-view__event-title text-white">{{ event.title || 'Steps' }}</div>
        </div>

        <v-btn
          color="white"
          density="compact"
          icon="mdi-pencil"
          variant="text"
          @click="openEdit"
        />
      </div>

      <!-- Steps grid -->
      <div class="task-view__body flex-grow-1">
        <div v-if="!event.subtasks?.length" class="task-view__empty text-medium-emphasis">
          No steps added yet.
        </div>

        <div v-else class="task-view__grid">
          <div
            v-for="task in event.subtasks"
            :key="task.id"
            class="task-view__tile"
            :class="{
              'task-view__tile--completed': isCompleted(task.id),
              'task-view__tile--locked': isLocked(task),
            }"
            @click="onTileClick(task)"
          >
            <div class="task-view__tile-icon" :style="tileIconStyle(task)">
              <v-icon v-if="task.iconLibrary === 'mdi'" color="white" :icon="task.icon" size="40" />
              <i v-else :class="`fas fa-${task.icon.replace('fa-', '')}`" style="font-size: 2rem; color: white" />

              <div v-if="isCompleted(task.id)" class="task-view__tile-check">
                <v-icon color="white" icon="mdi-check-circle" size="28" />
              </div>

              <div v-else-if="isLocked(task)" class="task-view__tile-lock">
                <v-icon color="white" icon="mdi-lock" size="20" />
              </div>
            </div>

            <div class="task-view__tile-label">{{ task.label }}</div>
          </div>
        </div>
      </div>

      <!-- Undo FAB -->
      <v-btn
        v-if="appStore.taskCompletionHistory.length > 0"
        class="task-view__undo"
        color="white"
        elevation="4"
        prepend-icon="mdi-undo"
        rounded="pill"
        @click="appStore.undoLastSubTask()"
      >
        Undo
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { EventSubTask } from '@/types/calendar'
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useCalendarStore } from '@/stores/calendar'

  const appStore = useAppStore()
  const calendarStore = useCalendarStore()

  const event = computed(() =>
    appStore.taskViewEventId
      ? calendarStore.calendarEventFindById(appStore.taskViewEventId)
      : null,
  )

  const date = computed(() => appStore.taskViewDate ?? '')

  function isCompleted (subtaskId: string): boolean {
    return appStore.getCompletedSubTasks(appStore.taskViewEventId ?? '', date.value).has(subtaskId)
  }

  function isLocked (task: EventSubTask): boolean {
    if (task.dependsOn.length === 0) return false
    return task.dependsOn.some(depId => !isCompleted(depId))
  }

  function tileIconStyle (task: EventSubTask) {
    const completed = isCompleted(task.id)
    const locked = isLocked(task)
    return {
      backgroundColor: completed
        ? 'rgba(0,0,0,0.18)'
        : (locked
          ? 'rgba(0,0,0,0.1)'
          : event.value?.color ?? '#3e4c5e'),
    }
  }

  function onTileClick (task: EventSubTask): void {
    if (isLocked(task) || isCompleted(task.id)) return
    appStore.completeSubTask(appStore.taskViewEventId ?? '', date.value, task.id)
  }

  function openEdit (): void {
    const id = appStore.taskViewEventId
    appStore.taskViewClose()
    if (id) appStore.dialogEventOpen(id)
  }
</script>

<style scoped>
.task-view__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  flex-shrink: 0;
}

.task-view__header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.task-view__event-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-view__event-title {
  font-size: 1.3rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-view__body {
  padding: 24px 16px;
  overflow-y: auto;
}

.task-view__empty {
  text-align: center;
  padding: 48px 24px;
  font-size: 1rem;
}

.task-view__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.task-view__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.task-view__tile:active:not(.task-view__tile--locked):not(.task-view__tile--completed) {
  transform: scale(0.95);
}

.task-view__tile--locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.task-view__tile--completed {
  opacity: 0.6;
}

.task-view__tile-icon {
  width: 88px;
  height: 88px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s;
}

.task-view__tile-check {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: #43a047;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.task-view__tile-lock {
  position: absolute;
  bottom: -6px;
  right: -6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.task-view__tile-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  color: #2c3d55;
  line-height: 1.2;
}

.task-view__undo {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
}
</style>
