import { apiClient } from './client'
import type { AjusteStock, Insumo, InsumoCreate, InsumoUpdate } from './types'

export interface ListInsumosParams {
  solo_alertas?: boolean
}

export function listInsumos(params: ListInsumosParams = {}): Promise<Insumo[]> {
  const query = new URLSearchParams()
  if (params.solo_alertas) query.set('solo_alertas', 'true')
  const qs = query.toString()
  return apiClient.get<Insumo[]>(`/insumos${qs ? `?${qs}` : ''}`)
}

export function createInsumo(payload: InsumoCreate): Promise<Insumo> {
  return apiClient.post<Insumo>('/insumos', payload)
}

export function updateInsumo(id: number, payload: InsumoUpdate): Promise<Insumo> {
  return apiClient.patch<Insumo>(`/insumos/${id}`, payload)
}

export function ajustarStockInsumo(id: number, payload: AjusteStock): Promise<Insumo> {
  return apiClient.post<Insumo>(`/insumos/${id}/ajustar-stock`, payload)
}

export function deleteInsumo(id: number): Promise<void> {
  return apiClient.delete<void>(`/insumos/${id}`)
}
