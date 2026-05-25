<template>
  <v-dialog v-model="isOpen" max-width="520" scrollable>
    <v-card>
      <v-card-title class="pa-4 pb-2 d-flex align-center">
        <span class="text-h6">Icon &amp; Color</span>
        <v-spacer />
        <v-btn density="compact" icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-card-text class="pa-3">
        <!-- Color section -->
        <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Color</div>

        <div class="color-swatches mb-2">
          <button
            v-for="c in PALETTE_COLORS"
            :key="c"
            class="color-swatch"
            :class="{ 'color-swatch--selected': localColor === c }"
            :style="{ backgroundColor: c }"
            type="button"
            @click="localColor = c"
          />
        </div>

        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title class="text-caption text-medium-emphasis py-1 px-3" style="min-height: 36px">
              Custom color
            </v-expansion-panel-title>

            <v-expansion-panel-text class="pa-0">
              <v-color-picker
                v-model="localColor"
                class="mx-auto"
                hide-inputs
                mode="hex"
                width="100%"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-divider class="my-3" />

        <!-- Icon section -->
        <div class="text-caption font-weight-medium text-medium-emphasis mb-2 text-uppercase" style="letter-spacing:0.06em">Icon</div>

        <v-text-field
          v-model="searchQuery"
          class="mb-3"
          clearable
          density="compact"
          hide-details
          placeholder="Search icons..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />

        <div v-if="filteredIcons.length === 0" class="text-center text-medium-emphasis pa-4">
          No icons found
        </div>

        <div v-else class="icon-grid">
          <v-tooltip
            v-for="iconDescriptor in filteredIcons"
            :key="iconDescriptor.key"
            location="top"
            :text="iconDescriptor.label"
          >
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                class="icon-grid__btn"
                :color="selectedKey === iconDescriptor.key ? 'primary' : 'default'"
                size="large"
                variant="tonal"
                @click="selectIcon(iconDescriptor)"
              >
                <v-icon v-if="iconDescriptor.library === 'mdi'" :icon="iconDescriptor.key" size="28" />
                <i v-else :class="`fas fa-${iconDescriptor.key.replace('fa-', '')}`" style="font-size: 1.5rem" />
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { filterIcons, type IconDescriptor } from '@/data/iconLibrary'
  import { PALETTE_COLORS } from '@/types/calendar'

  const props = defineProps<{
    selectedKey: string
    selectedColor: string
  }>()

  const emit = defineEmits<{
    'select:icon': [descriptor: IconDescriptor, color: string]
  }>()

  const isOpen = defineModel<boolean>({ required: true })

  const searchQuery = ref('')
  const localColor = ref(props.selectedColor)

  watch(() => props.selectedColor, c => {
    localColor.value = c
  })
  watch(isOpen, open => {
    if (open) {
      localColor.value = props.selectedColor
      searchQuery.value = ''
    }
  })

  const filteredIcons = ref(filterIcons(''))

  watch(searchQuery, q => {
    filteredIcons.value = filterIcons(q ?? '')
  })

  function selectIcon (descriptor: IconDescriptor): void {
    emit('select:icon', descriptor, localColor.value)
    isOpen.value = false
  }
</script>

<style scoped>
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
  flex-shrink: 0;
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch--selected {
  border-color: rgba(0, 0, 0, 0.5);
  transform: scale(1.15);
  box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(0, 0, 0, 0.3);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 6px;
}

.icon-grid__btn {
  min-width: 52px !important;
  width: 52px;
  height: 52px !important;
  padding: 0 !important;
}
</style>
