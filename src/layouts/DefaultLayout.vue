<script setup lang="ts">
import AppSidebar from '../components/layout/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100svh;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 28px;
}
</style>
