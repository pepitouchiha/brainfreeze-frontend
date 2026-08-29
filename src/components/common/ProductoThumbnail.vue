<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    variant?: 'thumb' | 'card'
  }>(),
  { src: null, variant: 'thumb' },
)
</script>

<template>
  <div class="producto-thumb" :class="`producto-thumb--${variant}`">
    <img v-if="src" :src="src" :alt="alt" class="producto-thumb-img" />
    <svg
      v-else
      class="producto-thumb-placeholder"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2"></rect>
      <circle cx="9" cy="10" r="2"></circle>
      <path d="m21 16-5.2-5.2a2 2 0 0 0-2.8 0L4 20"></path>
    </svg>
  </div>
</template>

<style scoped>
.producto-thumb {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  overflow: hidden;
}

.producto-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.producto-thumb--thumb {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
}

.producto-thumb--thumb .producto-thumb-placeholder {
  width: 18px;
  height: 18px;
}

.producto-thumb--card {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
}

.producto-thumb--card .producto-thumb-placeholder {
  width: 32px;
  height: 32px;
}
</style>
