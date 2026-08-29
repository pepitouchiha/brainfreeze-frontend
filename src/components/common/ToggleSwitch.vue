<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    ariaLabel?: string
    id?: string
  }>(),
  {
    disabled: false,
    ariaLabel: undefined,
    id: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    :id="id"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    class="toggle-switch"
    :class="{ 'toggle-switch--on': modelValue }"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="toggle-switch__thumb" />
  </button>
</template>

<style scoped>
.toggle-switch {
  --track-w: 40px;
  --track-h: 22px;
  --thumb-size: 16px;

  position: relative;
  display: inline-flex;
  align-items: center;
  width: var(--track-w);
  height: var(--track-h);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(224, 247, 250, 0.08);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.toggle-switch--on {
  background: rgba(178, 255, 5, 0.18);
  border-color: rgba(178, 255, 5, 0.5);
}

.toggle-switch__thumb {
  position: absolute;
  top: 50%;
  left: 3px;
  width: var(--thumb-size);
  height: var(--thumb-size);
  border-radius: 50%;
  background: var(--color-text-muted);
  transform: translateY(-50%);
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.toggle-switch--on .toggle-switch__thumb {
  background: var(--color-lime);
  transform: translateY(-50%) translateX(calc(var(--track-w) - var(--thumb-size) - 8px));
}

.toggle-switch:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.toggle-switch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
