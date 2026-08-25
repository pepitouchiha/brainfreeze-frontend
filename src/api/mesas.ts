import { apiClient } from './client'
import type { Mesa, MesaCreate } from './types'

export function listMesas(): Promise<Mesa[]> {
  return apiClient.get<Mesa[]>('/mesas')
}

export function createMesa(payload: MesaCreate): Promise<Mesa> {
  return apiClient.post<Mesa>('/mesas', payload)
}

export function liberarMesa(id: number): Promise<Mesa> {
  return apiClient.post<Mesa>(`/mesas/${id}/liberar`)
}
