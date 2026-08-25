import { crearVenta } from '../api/ventas'
import { ApiError } from '../api/client'
import type { Venta, VentaCreate } from '../api/types'

export function useVentas() {
  function create(payload: VentaCreate): Promise<Venta> {
    return crearVenta(payload)
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { create, messageFor }
}
