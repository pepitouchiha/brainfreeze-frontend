import { apiClient } from './client'
import type { Producto, ProductoCreate, ProductoUpdate } from './types'

export interface ListProductosParams {
  search?: string
  categoria_id?: number
}

export function listProductos(params: ListProductosParams = {}): Promise<Producto[]> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.categoria_id !== undefined) query.set('categoria_id', String(params.categoria_id))
  const qs = query.toString()
  return apiClient.get<Producto[]>(`/productos${qs ? `?${qs}` : ''}`)
}

export function createProducto(payload: ProductoCreate): Promise<Producto> {
  return apiClient.post<Producto>('/productos', payload)
}

export function updateProducto(id: number, payload: ProductoUpdate): Promise<Producto> {
  return apiClient.patch<Producto>(`/productos/${id}`, payload)
}

export function deleteProducto(id: number): Promise<void> {
  return apiClient.delete<void>(`/productos/${id}`)
}
