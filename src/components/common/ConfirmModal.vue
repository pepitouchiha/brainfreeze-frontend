<script setup lang="ts">
import BaseModal from './BaseModal.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    confirmText?: string
    confirmingText?: string
    cancelText?: string
    isConfirming?: boolean
  }>(),
  {
    confirmText: 'Eliminar',
    confirmingText: 'Eliminando…',
    cancelText: 'Cancelar',
    isConfirming: false,
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <BaseModal @close="emit('cancel')">
    <div class="confirm-modal">
      <h2>{{ title }}</h2>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button type="button" class="btn-secondary" :disabled="isConfirming" @click="emit('cancel')">
          {{ cancelText }}
        </button>
        <button type="button" class="btn-danger" :disabled="isConfirming" @click="emit('confirm')">
          {{ isConfirming ? confirmingText : confirmText }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.confirm-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-modal h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.confirm-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.btn-secondary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13.5px;
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  padding: 10px 16px;
  border: 1px solid rgba(255, 77, 109, 0.5);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 13.5px;
  color: #fff;
  background: var(--color-danger);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
