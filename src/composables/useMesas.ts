import { ref } from 'vue'
import { createMesa, deleteMesa, liberarMesa, listMesas, updateMesa } from '../api/mesas'
import { ApiError } from '../api/client'
import type { Mesa, MesaCreate, MesaUpdate } from '../api/types'

export function useMesas() {
  const mesas = ref<Mesa[]>([])
  const isLoading = ref(false)
  const loadError = ref('')

  async function load(): Promise<void> {
    isLoading.value = true
    loadError.value = ''
    try {
      mesas.value = await listMesas()
    } catch {
      loadError.value = 'No fue posible cargar las mesas. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: MesaCreate): Promise<void> {
    const nueva = await createMesa(payload)
    mesas.value = [...mesas.value, nueva].sort((a, b) =>
      a.nombre_o_numero.localeCompare(b.nombre_o_numero),
    )
  }

  async function liberar(id: number): Promise<void> {
    const actualizada = await liberarMesa(id)
    mesas.value = mesas.value.map((m) => (m.id === id ? actualizada : m))
  }

  async function update(id: number, payload: MesaUpdate): Promise<void> {
    const actualizada = await updateMesa(id, payload)
    mesas.value = mesas.value
      .map((m) => (m.id === id ? actualizada : m))
      .sort((a, b) => a.nombre_o_numero.localeCompare(b.nombre_o_numero))
  }

  async function remove(id: number): Promise<void> {
    await deleteMesa(id)
    mesas.value = mesas.value.filter((m) => m.id !== id)
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { mesas, isLoading, loadError, load, create, liberar, update, remove, messageFor }
}
