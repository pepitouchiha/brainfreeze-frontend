import { reactive } from 'vue'

export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = reactive<Toast[]>([])
const DURATION_MS = 3500

let nextId = 1

function dismiss(id: number): void {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index !== -1) {
    toasts.splice(index, 1)
  }
}

function push(message: string, type: ToastType = 'success'): number {
  const id = nextId++
  toasts.push({ id, message, type })
  setTimeout(() => dismiss(id), DURATION_MS)
  return id
}

export function useToast() {
  return { toasts, push, dismiss }
}
