import { apiClient } from './client'
import type { Venta, VentaCreate } from './types'

export function crearVenta(payload: VentaCreate): Promise<Venta> {
  return apiClient.post<Venta>('/ventas', payload)
}
