<template>
  <v-dialog v-model="isOpen" max-width="320">
    <v-card>
      <v-card-title class="text-body-1 font-weight-bold pa-4 pb-2">
        Delete event?
      </v-card-title>

      <v-card-text class="pa-4 pt-1 text-medium-emphasis">
        This will remove the event{{ isRecurring ? ' and all its repeats' : '' }}.
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="onConfirm">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  const props = defineProps<{
    isRecurring: boolean
  }>()

  const emit = defineEmits<{
    confirm: []
  }>()

  const isOpen = defineModel<boolean>({ required: true })

  function onConfirm (): void {
    emit('confirm')
    isOpen.value = false
  }
</script>
