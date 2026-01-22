<template>
  <div>
    <!-- Cosmic Particles Effect (matches main page) -->
    <div class="cosmic-particles"></div>

    <!-- Aurora Effect (matches main page) -->
    <div class="aurora-effect"></div>

    <div id="app" class="min-h-screen text-white">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // Check authentication status on app load
  authStore.checkAuth()
})
</script>

<style>
/* Vue-specific styles only - main styles loaded from /css/style.css */
#app {
  position: relative;
  z-index: 10;
}

/* Ensure all content is above background effects */
body > * {
  position: relative;
  z-index: 1;
}
</style>
