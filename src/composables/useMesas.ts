import { ref } from 'vue'
import { createMesa, liberarMesa, listMesas } from '../api/mesas'
import { ApiError } from '../api/client'
import type { Mesa, MesaCreate } from '../api/types'

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

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { mesas, isLoading, loadError, load, create, liberar, messageFor }
}
