<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconChevronUp from '../icons/IconChevronUp.vue'
import IconChevronDown from '../icons/IconChevronDown.vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | ''
    min?: number
    max?: number
    step?: number | 'any'
    disabled?: boolean
    placeholder?: string
    id?: string
  }>(),
  {
    min: undefined,
    max: undefined,
    step: undefined,
    disabled: false,
    placeholder: undefined,
    id: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | ''] }>()

const displayValue = ref(props.modelValue === '' ? '' : String(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    if (value === '') {
      displayValue.value = ''
      return
    }
    const parsedCurrent = displayValue.value === '' ? NaN : Number(displayValue.value)
    if (parsedCurrent !== value) {
      displayValue.value = String(value)
    }
  },
)

const stepAmount = computed<number>(() => {
  if (props.step === undefined || props.step === 'any') return 1
  return props.step
})

const isAtMin = computed<boolean>(() => {
  if (props.min === undefined || props.modelValue === '') return false
  return Number(props.modelValue) <= props.min
})

const isAtMax = computed<boolean>(() => {
  if (props.max === undefined || props.modelValue === '') return false
  return Number(props.modelValue) >= props.max
})

function clamp(value: number): number {
  let result = value
  if (props.min !== undefined) result = Math.max(result, props.min)
  if (props.max !== undefined) result = Math.min(result, props.max)
  return result
}

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  displayValue.value = raw
  if (raw === '') {
    emit('update:modelValue', '')
    return
  }
  const parsed = Number(raw)
  if (!Number.isNaN(parsed)) {
    emit('update:modelValue', parsed)
  }
}

function increment() {
  if (props.disabled || isAtMax.value) return
  const next =
    props.modelValue === ''
      ? props.min !== undefined
        ? props.min
        : 0
      : Number(props.modelValue) + stepAmount.value
  emit('update:modelValue', clamp(next))
}

function decrement() {
  if (props.disabled || isAtMin.value) return
  const next =
    props.modelValue === ''
      ? props.min !== undefined
        ? props.min
        : 0
      : Number(props.modelValue) - stepAmount.value
  emit('update:modelValue', clamp(next))
}
</script>

<template>
  <div class="number-input" :class="{ 'number-input--disabled': disabled }">
    <input
      :id="id"
      type="number"
      class="number-input__field"
      :value="displayValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="onInput"
    />
    <div class="number-input__steppers">
      <button
        type="button"
        class="number-input__stepper"
        aria-label="Aumentar"
        :disabled="disabled || isAtMax"
        @click="increment"
      >
        <IconChevronUp />
      </button>
      <button
        type="button"
        class="number-input__stepper"
        aria-label="Disminuir"
        :disabled="disabled || isAtMin"
        @click="decrement"
      >
        <IconChevronDown />
      </button>
    </div>
  </div>
</template>

<style scoped>
.number-input {
  display: flex;
  align-items: stretch;
  gap: 6px;
  width: 100%;
}

.number-input--disabled {
  opacity: 0.7;
}

.number-input__field {
  flex: 1;
  min-width: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
  -moz-appearance: textfield;
}

.number-input__field::-webkit-outer-spin-button,
.number-input__field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input__steppers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.number-input__stepper {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.number-input__stepper :deep(.icon-chevron-up),
.number-input__stepper :deep(.icon-chevron-down) {
  width: 11px;
  height: 11px;
}

.number-input__stepper:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.12);
}

.number-input__stepper:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.number-input__stepper:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
