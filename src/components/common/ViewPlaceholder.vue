<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="placeholder">
    <h1>{{ title }}</h1>
    <p>Esta pantalla se implementará en una tarea posterior.</p>
  </section>
</template>

<style scoped>
.placeholder h1 {
  margin: 0 0 8px;
  font-size: 22px;
  color: var(--color-text);
}

.placeholder p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
