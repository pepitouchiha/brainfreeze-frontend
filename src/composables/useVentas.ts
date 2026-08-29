import { ref } from 'vue'
import { crearVenta, listVentas } from '../api/ventas'
import { ApiError } from '../api/client'
import type { Venta, VentaCreate } from '../api/types'

export function useVentas() {
  const ventas = ref<Venta[]>([])
  const isLoading = ref(false)
  const loadError = ref('')

  function create(payload: VentaCreate): Promise<Venta> {
    return crearVenta(payload)
  }

  async function load(): Promise<void> {
    isLoading.value = true
    loadError.value = ''
    try {
      ventas.value = await listVentas()
    } catch {
      loadError.value = 'No fue posible cargar las ventas. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { ventas, isLoading, loadError, create, load, messageFor }
}
