<template>
  <div class="subtask-editor">
    <div v-if="modelValue.length > 0" class="subtask-list mb-3">
      <div
        v-for="(task, index) in modelValue"
        :key="task.id"
        class="subtask-row"
      >
        <div class="subtask-row__icon" :style="{ backgroundColor: iconBg }">
          <v-icon v-if="task.iconLibrary === 'mdi'" color="white" :icon="task.icon" size="18" />
          <i v-else :class="`fas fa-${task.icon.replace('fa-', '')}`" style="font-size: 1rem; color: white" />
        </div>

        <span class="subtask-row__label">{{ task.label }}</span>

        <v-chip
          v-for="depId in task.dependsOn"
          :key="depId"
          class="mr-1"
          density="compact"
          size="x-small"
          variant="tonal"
        >
          after: {{ labelForId(depId) }}
        </v-chip>

        <v-spacer />

        <v-btn
          density="compact"
          icon="mdi-pencil"
          size="x-small"
          variant="text"
          @click="startEdit(index)"
        />

        <v-btn
          color="error"
          density="compact"
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="removeTask(index)"
        />
      </div>
    </div>

    <v-btn
      color="secondary"
      prepend-icon="mdi-plus"
      size="small"
      variant="tonal"
      @click="startAdd"
    >
      Add step
    </v-btn>

    <!-- Inline add/edit form -->
    <v-card v-if="formOpen" class="mt-3 pa-3" rounded="lg" variant="outlined">
      <div class="text-caption font-weight-medium mb-2">
        {{ editingIndex !== null ? 'Edit step' : 'New step' }}
      </div>

      <div class="d-flex align-center gap-2 mb-3">
        <div
          class="subtask-icon-btn"
          :style="{ backgroundColor: draft.icon ? iconBg : 'rgba(0,0,0,0.1)' }"
          @click="iconPickerOpen = true"
        >
          <v-icon v-if="draft.iconLibrary === 'mdi' && draft.icon" color="white" :icon="draft.icon" size="22" />
          <i v-else-if="draft.icon" :class="`fas fa-${draft.icon.replace('fa-', '')}`" style="font-size: 1.2rem; color: white" />
          <v-icon v-else color="grey" icon="mdi-image-outline" size="22" />
        </div>

        <v-text-field
          v-model="draft.label"
          density="compact"
          hide-details
          label="Label (e.g. Brush teeth)"
          variant="outlined"
          @keyup.enter="saveForm"
        />
      </div>

      <v-select
        v-if="otherTasks.length > 0"
        chips
        class="mb-3"
        closable-chips
        density="compact"
        hide-details
        item-title="label"
        item-value="id"
        :items="otherTasks"
        label="Depends on (optional)"
        :model-value="draft.dependsOn"
        multiple
        variant="outlined"
        @update:model-value="draft.dependsOn = $event"
      />

      <div class="d-flex gap-2 justify-end">
        <v-btn size="small" variant="text" @click="cancelForm">Cancel</v-btn>

        <v-btn
          color="primary"
          :disabled="!draft.icon || !draft.label.trim()"
          size="small"
          variant="flat"
          @click="saveForm"
        >
          {{ editingIndex !== null ? 'Save' : 'Add' }}
        </v-btn>
      </div>
    </v-card>

    <!-- Motivational reward suggestion -->
    <v-card
      v-if="showMotivationalSuggestion && !formOpen"
      class="mt-3 pa-3"
      color="amber-lighten-4"
      rounded="lg"
      variant="flat"
    >
      <div class="d-flex align-center gap-2">
        <v-icon color="amber-darken-2" icon="mdi-star-circle" size="20" />

        <div style="flex: 1">
          <div class="text-body-2 font-weight-medium">Add a motivational reward step?</div>
          <div class="text-caption text-medium-emphasis">Something to celebrate when all steps are done!</div>
        </div>

        <v-btn
          density="compact"
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="showMotivationalSuggestion = false"
        />
      </div>

      <div class="d-flex justify-end mt-2">
        <v-btn color="amber-darken-2" size="small" variant="flat" @click="openRewardStep">
          Add reward
        </v-btn>
      </div>
    </v-card>

    <IconPickerDialog v-model="iconPickerOpen" :selected-key="draft.icon" @select:icon="onIconSelect" />
  </div>
</template>

<script lang="ts" setup>
  import type { IconDescriptor } from '@/data/iconLibrary'
  import type { EventSubTask } from '@/types/calendar'
  import { computed, reactive, ref } from 'vue'

  const props = defineProps<{
    modelValue: EventSubTask[]
    iconBg: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [tasks: EventSubTask[]]
  }>()

  const formOpen = ref(false)
  const editingIndex = ref<number | null>(null)
  const iconPickerOpen = ref(false)
  const showMotivationalSuggestion = ref(false)

  const draft = reactive<{ icon: string, iconLibrary: 'mdi' | 'fa', label: string, dependsOn: string[] }>({
    icon: '',
    iconLibrary: 'mdi',
    label: '',
    dependsOn: [],
  })

  const otherTasks = computed(() => {
    if (editingIndex.value === null) return props.modelValue
    return props.modelValue.filter((_, i) => i !== editingIndex.value)
  })

  function labelForId (id: string): string {
    return props.modelValue.find(t => t.id === id)?.label ?? id
  }

  function startAdd (): void {
    showMotivationalSuggestion.value = false
    editingIndex.value = null
    draft.icon = ''
    draft.iconLibrary = 'mdi'
    draft.label = ''
    draft.dependsOn = []
    formOpen.value = true
  }

  function startEdit (index: number): void {
    showMotivationalSuggestion.value = false
    const task = props.modelValue[index]
    editingIndex.value = index
    draft.icon = task.icon
    draft.iconLibrary = task.iconLibrary
    draft.label = task.label
    draft.dependsOn = [...task.dependsOn]
    formOpen.value = true
  }

  function saveForm (): void {
    if (!draft.icon || !draft.label.trim()) return
    const updated = [...props.modelValue]
    const task: EventSubTask = {
      id: editingIndex.value === null ? crypto.randomUUID() : props.modelValue[editingIndex.value].id,
      icon: draft.icon,
      iconLibrary: draft.iconLibrary,
      label: draft.label.trim(),
      dependsOn: draft.dependsOn,
    }
    const isNew = editingIndex.value === null
    if (editingIndex.value === null) {
      updated.push(task)
    } else {
      updated[editingIndex.value] = task
    }
    emit('update:modelValue', updated)
    formOpen.value = false

    if (isNew) {
      const allIds = updated.map(t => t.id)
      const hasRewardStep = updated.some(t =>
        allIds.filter(id => id !== t.id).every(id => t.dependsOn.includes(id)),
      )
      if (!hasRewardStep) showMotivationalSuggestion.value = true
    }
  }

  function openRewardStep (): void {
    showMotivationalSuggestion.value = false
    editingIndex.value = null
    draft.icon = ''
    draft.iconLibrary = 'mdi'
    draft.label = ''
    draft.dependsOn = props.modelValue.map(t => t.id)
    formOpen.value = true
  }

  function cancelForm (): void {
    formOpen.value = false
  }

  function removeTask (index: number): void {
    const updated = props.modelValue.filter((_, i) => i !== index)
    // Clean up any dependsOn references to removed task
    const removedId = props.modelValue[index].id
    const cleaned = updated.map(t => ({
      ...t,
      dependsOn: t.dependsOn.filter(id => id !== removedId),
    }))
    emit('update:modelValue', cleaned)
  }

  function onIconSelect (descriptor: IconDescriptor): void {
    draft.icon = descriptor.key
    draft.iconLibrary = descriptor.library
  }
</script>

<style scoped>
.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subtask-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.03);
}

.subtask-row__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.subtask-row__label {
  font-size: 0.85rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtask-icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.subtask-icon-btn:hover {
  opacity: 0.85;
}
</style>
