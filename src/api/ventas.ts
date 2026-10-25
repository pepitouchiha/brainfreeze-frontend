import { apiClient } from './client'
import type {
  EstadoVenta,
  Venta,
  VentaAbrir,
  VentaAgregarItems,
  VentaCambiarCantidadItem,
  VentaCerrar,
  VentaCreate,
  VentaUpdate,
} from './types'

export interface ListVentasParams {
  desde?: string
  hasta?: string
  mesa_id?: number
  estado?: EstadoVenta
}

export function crearVenta(payload: VentaCreate): Promise<Venta> {
  return apiClient.post<Venta>('/ventas', payload)
}

export function listVentas(params: ListVentasParams = {}): Promise<Venta[]> {
  const query = new URLSearchParams()
  if (params.desde) query.set('desde', params.desde)
  if (params.hasta) query.set('hasta', params.hasta)
  if (params.mesa_id !== undefined) query.set('mesa_id', String(params.mesa_id))
  if (params.estado) query.set('estado', params.estado)
  const qs = query.toString()
  return apiClient.get<Venta[]>(`/ventas${qs ? `?${qs}` : ''}`)
}

export function cancelarVenta(id: number): Promise<Venta> {
  return apiClient.post<Venta>(`/ventas/${id}/cancelar`)
}

export function obtenerVenta(id: number): Promise<Venta> {
  return apiClient.get<Venta>(`/ventas/${id}`)
}

export function actualizarVenta(id: number, payload: VentaUpdate): Promise<Venta> {
  return apiClient.put<Venta>(`/ventas/${id}`, payload)
}

/** `POST /ventas/abrir` (BE-025): abre un pedido vacío (estado 'abierta') en una mesa. */
export function abrirPedido(payload: VentaAbrir): Promise<Venta> {
  return apiClient.post<Venta>('/ventas/abrir', payload)
}

/** `POST /ventas/{id}/items` (BE-026): agrega líneas nuevas a un pedido abierto. */
export function agregarItemsPedido(id: number, payload: VentaAgregarItems): Promise<Venta> {
  return apiClient.post<Venta>(`/ventas/${id}/items`, payload)
}

/** `DELETE /ventas/{id}/items/{itemId}` (BE-026): quita un item puntual de un pedido abierto. */
export function quitarItemPedido(id: number, itemId: number): Promise<Venta> {
  return apiClient.delete<Venta>(`/ventas/${id}/items/${itemId}`)
}

/** `PATCH /ventas/{id}/items/{itemId}`: cambia la cantidad de un item de un pedido abierto (botones −/+). */
export function cambiarCantidadItemPedido(
  id: number,
  itemId: number,
  payload: VentaCambiarCantidadItem,
): Promise<Venta> {
  return apiClient.patch<Venta>(`/ventas/${id}/items/${itemId}`, payload)
}

/** `POST /ventas/{id}/cerrar` (BE-027): cobra y cierra un pedido abierto, libera la mesa. */
export function cerrarPedido(id: number, payload: VentaCerrar): Promise<Venta> {
  return apiClient.post<Venta>(`/ventas/${id}/cerrar`, payload)
}

/**
 * `POST /ventas/{id}/descartar` (BE-027): el backend responde `204` sin
 * cuerpo cuando el pedido se borra por completo (sin items) — `apiClient`
 * ya devuelve `undefined` en ese caso (no es JSON), sin lanzar error de
 * parseo — y `200` con la venta cancelada cuando se conserva para
 * auditoría (con items).
 */
export async function descartarPedido(id: number): Promise<Venta | null> {
  const data = await apiClient.post<Venta | null>(`/ventas/${id}/descartar`)
  return data ?? null
}
