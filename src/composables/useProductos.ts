import { ref } from 'vue'
import { createProducto, deleteProducto, listProductos, updateProducto } from '../api/productos'
import type { ListProductosParams } from '../api/productos'
import { ApiError } from '../api/client'
import type { Producto, ProductoCreate, ProductoUpdate } from '../api/types'

export function useProductos() {
  const productos = ref<Producto[]>([])
  const total = ref(0)
  const isLoading = ref(false)
  const loadError = ref('')

  async function loadTotal(): Promise<void> {
    try {
      total.value = (await listProductos()).length
    } catch {
      // El contador total es informativo; si falla se conserva el último valor conocido.
    }
  }

  async function load(filters: ListProductosParams = {}): Promise<void> {
    isLoading.value = true
    loadError.value = ''
    try {
      productos.value = await listProductos(filters)
    } catch {
      loadError.value = 'No fue posible cargar los productos. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  function create(payload: ProductoCreate): Promise<Producto> {
    return createProducto(payload)
  }

  function update(id: number, payload: ProductoUpdate): Promise<Producto> {
    return updateProducto(id, payload)
  }

  function remove(id: number): Promise<void> {
    return deleteProducto(id)
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { productos, total, isLoading, loadError, loadTotal, load, create, update, remove, messageFor }
}
