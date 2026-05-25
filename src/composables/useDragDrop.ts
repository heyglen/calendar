import { reactive } from 'vue'

export const dragState = reactive<{
  eventId: string | null
  grabOffsetMinutes: number
}>({
  eventId: null,
  grabOffsetMinutes: 0,
})
