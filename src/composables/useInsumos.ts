import { ref } from 'vue'
import {
  ajustarStockInsumo,
  createInsumo,
  deleteInsumo,
  listInsumos,
  updateInsumo,
} from '../api/insumos'
import { ApiError } from '../api/client'
import type { Insumo, InsumoCreate, InsumoUpdate } from '../api/types'

export function useInsumos() {
  const insumos = ref<Insumo[]>([])
  const isLoading = ref(false)
  const loadError = ref('')

  async function load(): Promise<void> {
    isLoading.value = true
    loadError.value = ''
    try {
      insumos.value = await listInsumos()
    } catch {
      loadError.value = 'No fue posible cargar el inventario. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  function create(payload: InsumoCreate): Promise<Insumo> {
    return createInsumo(payload)
  }

  function update(id: number, payload: InsumoUpdate): Promise<Insumo> {
    return updateInsumo(id, payload)
  }

  async function ajustarStock(id: number, cantidad: number): Promise<void> {
    const actualizado = await ajustarStockInsumo(id, { cantidad })
    insumos.value = insumos.value.map((i) => (i.id === id ? actualizado : i))
  }

  function remove(id: number): Promise<void> {
    return deleteInsumo(id)
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { insumos, isLoading, loadError, load, create, update, ajustarStock, remove, messageFor }
}
