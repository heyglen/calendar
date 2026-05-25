<template>
  <v-dialog max-width="420" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pa-4 pb-0 d-flex align-center">
        <span class="text-h6">Keyboard Shortcuts</span>
        <v-spacer />
        <v-btn density="compact" icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="pa-4">
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  defineProps<{ modelValue: boolean }>()
  defineEmits<{ 'update:modelValue': [value: boolean] }>()

  const shortcuts = [
    { key: 't', description: 'Go to today' },
    { key: 'n', description: 'New event' },
    { key: 'd', description: 'Day view' },
    { key: 'w', description: 'Week view' },
    { key: 'Alt+1 / 2 / 3 / 4', description: 'Switch to Day / Week / Month / Year view' },
    { key: '← / →', description: 'Previous / next day (always ±1 day)' },
    { key: 'Alt+← / →', description: 'Navigate by view unit (day / week / month / year)' },
    { key: '↑ / ↓', description: 'Select hour in day view (↑ starts at 23:00, ↓ starts at current hour)' },
    { key: '← / → (hour selected)', description: 'Change day while keeping hour highlighted' },
    { key: 'Enter', description: 'Open or create event at selected hour' },
    { key: 's', description: 'Toggle settings' },
    { key: '?', description: 'Show this help' },
    { key: 'Esc', description: 'Close dialog' },
  ]
</script>

<style scoped>
.shortcut-key {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: nowrap;
}
</style>
