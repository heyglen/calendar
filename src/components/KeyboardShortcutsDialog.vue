<template>
  <v-dialog max-width="480" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pa-4 pb-0 d-flex align-center">
        <span class="text-h6">Help</span>
        <v-spacer />
        <v-btn density="compact" icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-0 d-flex help-dialog__body">
        <v-tabs
          v-model="activeTab"
          class="help-dialog__tabs"
          color="primary"
          direction="vertical"
        >
          <v-tab prepend-icon="mdi-keyboard-outline" value="shortcuts">Shortcuts</v-tab>
          <v-tab prepend-icon="mdi-shield-lock-outline" value="privacy">Privacy</v-tab>
        </v-tabs>

        <v-divider vertical />

        <v-window v-model="activeTab" class="help-dialog__panel">
          <!-- Shortcuts -->
          <v-window-item class="pa-4" value="shortcuts">
            <v-table density="compact">
              <tbody>
                <tr v-for="shortcut in shortcuts" :key="shortcut.key">
                  <td class="text-left pr-4">
                    <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
                  </td>

                  <td class="text-left text-body-2">{{ shortcut.description }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-window-item>

          <!-- Privacy -->
          <v-window-item class="pa-4" value="privacy">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-3 text-uppercase" style="letter-spacing:0.06em">Data storage</div>

            <v-list class="pa-0" density="compact" lines="two">
              <v-list-item prepend-icon="mdi-database-off-outline">
                <v-list-item-title class="text-body-2 font-weight-medium">Stored locally only</v-list-item-title>
                <v-list-item-subtitle class="text-caption">All your calendar data lives in your browser's localStorage. Nothing is sent to any server.</v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-devices">
                <v-list-item-title class="text-body-2 font-weight-medium">Device-specific</v-list-item-title>
                <v-list-item-subtitle class="text-caption">Data is tied to this browser and device. It won't sync across devices automatically.</v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-alert-circle-outline">
                <v-list-item-title class="text-body-2 font-weight-medium">Clearing storage deletes data</v-list-item-title>
                <v-list-item-subtitle class="text-caption">Clearing your browser cache or localStorage will permanently erase your calendar. Export a backup regularly.</v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-file-export-outline">
                <v-list-item-title class="text-body-2 font-weight-medium">Backup & restore</v-list-item-title>
                <v-list-item-subtitle class="text-caption">Use Settings → Data → Export to download a JSON backup. You can re-import it at any time to restore your events.</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  defineProps<{ modelValue: boolean }>()
  defineEmits<{ 'update:modelValue': [value: boolean] }>()

  const activeTab = ref('shortcuts')

  const shortcuts = [
    { key: 't', description: 'Go to today' },
    { key: 'n', description: 'New event' },
    { key: 'd', description: 'Day view' },
    { key: 'w', description: 'Week view' },
    { key: 'u', description: 'Up Next view' },
    { key: 'Alt+1–5', description: 'Switch to Up Next / Day / Week / Month / Year view' },
    { key: 'Shift+Alt+← / →', description: 'Cycle to previous / next view' },
    { key: '← / →', description: 'Previous / next day' },
    { key: 'Alt+← / →', description: 'Navigate by view unit (week / month / year)' },
    { key: '↑ / ↓', description: 'Select hour in day / week view' },
    { key: '← / → (hour selected)', description: 'Change day while keeping hour highlighted' },
    { key: 'Enter', description: 'Open or create event at selected time / month' },
    { key: 'Alt+S', description: 'Save event form' },
    { key: 'Alt+A', description: 'Toggle advanced options in event form' },
    { key: 'Alt+,', description: 'Toggle settings' },
    { key: 's', description: 'Toggle settings' },
    { key: 'Alt+F1 / ?', description: 'Show this help' },
    { key: 'Esc', description: 'Close dialog' },
  ]
</script>

<style scoped>
.shortcut-key {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: nowrap;
}

.help-dialog__body {
  min-height: 360px;
  max-height: 65vh;
  overflow: hidden;
}

.help-dialog__tabs {
  width: 130px;
  flex-shrink: 0;
}

.help-dialog__panel {
  flex: 1;
  overflow-y: auto;
}
</style>
