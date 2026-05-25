<script lang="ts" setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAppStore } from '@/stores/app'

  const router = useRouter()
  const appStore = useAppStore()

  onMounted(() => {
    router.replace('/')
    appStore.settingsDialogOpen = true
  })
</script>
