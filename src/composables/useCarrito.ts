import { computed, ref } from 'vue'
import type { Producto, VentaItemCreate } from '../api/types'

export interface CarritoLinea {
  producto: Producto
  cantidad: number
}

export function useCarrito() {
  const lineas = ref<CarritoLinea[]>([])

  const total = computed(() =>
    lineas.value.reduce((acc, linea) => acc + linea.producto.precio * linea.cantidad, 0),
  )

  function subtotal(linea: CarritoLinea): number {
    return linea.producto.precio * linea.cantidad
  }

  function add(producto: Producto): void {
    const existente = lineas.value.find((l) => l.producto.id === producto.id)
    if (existente) {
      existente.cantidad += 1
    } else {
      lineas.value.push({ producto, cantidad: 1 })
    }
  }

  function incrementar(productoId: number): void {
    const linea = lineas.value.find((l) => l.producto.id === productoId)
    if (linea) linea.cantidad += 1
  }

  function decrementar(productoId: number): void {
    const linea = lineas.value.find((l) => l.producto.id === productoId)
    if (!linea) return
    if (linea.cantidad <= 1) {
      remove(productoId)
    } else {
      linea.cantidad -= 1
    }
  }

  function remove(productoId: number): void {
    lineas.value = lineas.value.filter((l) => l.producto.id !== productoId)
  }

  function clear(): void {
    lineas.value = []
  }

  function toItems(): VentaItemCreate[] {
    return lineas.value.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad }))
  }

  return { lineas, total, subtotal, add, incrementar, decrementar, remove, clear, toItems }
}
