import { apiClient } from './client'
import type { Categoria, CategoriaCreate, CategoriaUpdate } from './types'

export function listCategorias(): Promise<Categoria[]> {
  return apiClient.get<Categoria[]>('/categorias')
}

export function createCategoria(payload: CategoriaCreate): Promise<Categoria> {
  return apiClient.post<Categoria>('/categorias', payload)
}

export function updateCategoria(id: number, payload: CategoriaUpdate): Promise<Categoria> {
  return apiClient.patch<Categoria>(`/categorias/${id}`, payload)
}

export function deleteCategoria(id: number): Promise<void> {
  return apiClient.delete<void>(`/categorias/${id}`)
}
