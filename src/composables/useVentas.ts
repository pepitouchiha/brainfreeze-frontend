import { ref } from 'vue'
import {
  abrirPedido,
  actualizarVenta,
  agregarItemsPedido,
  cambiarCantidadItemPedido,
  cancelarVenta,
  cerrarPedido,
  crearVenta,
  descartarPedido,
  listVentas,
  obtenerVenta,
  quitarItemPedido,
} from '../api/ventas'
import type { ListVentasParams } from '../api/ventas'
import { ApiError } from '../api/client'
import type {
  Venta,
  VentaAbrir,
  VentaAgregarItems,
  VentaCambiarCantidadItem,
  VentaCerrar,
  VentaCreate,
  VentaUpdate,
} from '../api/types'

export function useVentas() {
  const ventas = ref<Venta[]>([])
  const isLoading = ref(false)
  const loadError = ref('')

  function create(payload: VentaCreate): Promise<Venta> {
    return crearVenta(payload)
  }

  async function load(filters: ListVentasParams = {}): Promise<void> {
    isLoading.value = true
    loadError.value = ''
    try {
      ventas.value = await listVentas(filters)
    } catch {
      loadError.value = 'No fue posible cargar las ventas. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  function cancel(id: number): Promise<Venta> {
    return cancelarVenta(id)
  }

  function getById(id: number): Promise<Venta> {
    return obtenerVenta(id)
  }

  function update(id: number, payload: VentaUpdate): Promise<Venta> {
    return actualizarVenta(id, payload)
  }

  function abrirPedidoNuevo(payload: VentaAbrir): Promise<Venta> {
    return abrirPedido(payload)
  }

  function agregarItems(id: number, payload: VentaAgregarItems): Promise<Venta> {
    return agregarItemsPedido(id, payload)
  }

  function quitarItem(id: number, itemId: number): Promise<Venta> {
    return quitarItemPedido(id, itemId)
  }

  function cambiarCantidadItem(
    id: number,
    itemId: number,
    payload: VentaCambiarCantidadItem,
  ): Promise<Venta> {
    return cambiarCantidadItemPedido(id, itemId, payload)
  }

  function cerrarPedidoActual(id: number, payload: VentaCerrar): Promise<Venta> {
    return cerrarPedido(id, payload)
  }

  function descartarPedidoActual(id: number): Promise<Venta | null> {
    return descartarPedido(id)
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return {
    ventas,
    isLoading,
    loadError,
    create,
    load,
    cancel,
    getById,
    update,
    abrirPedido: abrirPedidoNuevo,
    agregarItems,
    quitarItem,
    cambiarCantidadItem,
    cerrarPedido: cerrarPedidoActual,
    descartarPedido: descartarPedidoActual,
    messageFor,
  }
}
