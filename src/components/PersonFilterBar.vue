<template>
  <div class="person-filter-bar">
    <v-chip
      class="mr-1"
      color="primary"
      size="small"
      :variant="isAllActive ? 'flat' : 'outlined'"
      @click="calendarStore.personFilterSet(null)"
    >
      All
    </v-chip>

    <v-chip
      v-for="person in calendarStore.preferences.people"
      :key="person.id"
      class="mr-1"
      :color="person.color"
      size="small"
      :variant="isPersonActive(person.id) ? 'flat' : 'outlined'"
      @click="calendarStore.personFilterToggle(person.id)"
    >
      <template #prepend>
        <v-avatar
          v-if="person.avatarBase64"
          class="mr-1"
          :image="person.avatarBase64"
          size="18"
        />

        <v-avatar
          v-else
          class="mr-1"
          :color="person.color"
          size="18"
        >
          <span style="font-size: 0.6rem; color: white; font-weight: 700">
            {{ person.name.charAt(0).toUpperCase() }}
          </span>
        </v-avatar>
      </template>
      {{ person.name }}
    </v-chip>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useCalendarStore } from '@/stores/calendar'

  const calendarStore = useCalendarStore()

  const isAllActive = computed(() => calendarStore.preferences.activePersonFilter === null)

  function isPersonActive (id: string): boolean {
    const filter = calendarStore.preferences.activePersonFilter
    return filter === null || filter.includes(id)
  }
</script>

<style scoped>
.person-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--v-theme-surface);
  flex-shrink: 0;
}
</style>
