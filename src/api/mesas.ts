import { apiClient } from './client'
import type { Mesa, MesaCreate, MesaUpdate } from './types'

export function listMesas(): Promise<Mesa[]> {
  return apiClient.get<Mesa[]>('/mesas')
}

export function createMesa(payload: MesaCreate): Promise<Mesa> {
  return apiClient.post<Mesa>('/mesas', payload)
}

export function updateMesa(id: number, payload: MesaUpdate): Promise<Mesa> {
  return apiClient.put<Mesa>(`/mesas/${id}`, payload)
}

export function deleteMesa(id: number): Promise<void> {
  return apiClient.delete<void>(`/mesas/${id}`)
}

export function liberarMesa(id: number): Promise<Mesa> {
  return apiClient.post<Mesa>(`/mesas/${id}/liberar`)
}
