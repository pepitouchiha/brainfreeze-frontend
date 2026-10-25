<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCategorias } from '../composables/useCategorias'
import { useProductos } from '../composables/useProductos'
import { useVentas } from '../composables/useVentas'
import { useToast } from '../composables/useToast'
import BaseModal from './common/BaseModal.vue'
import ConfirmModal from './common/ConfirmModal.vue'
import ProductoThumbnail from './common/ProductoThumbnail.vue'
import IconTrash from './icons/IconTrash.vue'
import IconBanknote from './icons/IconBanknote.vue'
import IconTransfer from './icons/IconTransfer.vue'
import { formatCOP } from '../utils/currency'
import type { MetodoPago, Producto, Venta, VentaItem } from '../api/types'

const props = defineProps<{
  venta: Venta
  mesaNombre: string
}>()

const emit = defineEmits<{
  close: []
  settled: []
}>()

const { agregarItems, quitarItem, cambiarCantidadItem, cerrarPedido, descartarPedido, messageFor } = useVentas()
const { productos, load: loadProductos } = useProductos()
const { categorias, load: loadCategorias } = useCategorias()
const { push: pushToast } = useToast()

const ventaActual = ref<Venta>(props.venta)

const search = ref('')
const categoriaFiltro = ref<number | ''>('')
const addingProductoId = ref<number | null>(null)
const addError = ref('')

// Item con una operación en curso (−, + o quitar): se bloquean sus botones
// hasta que responda el backend, para no mandar cambios superpuestos.
const busyItemId = ref<number | null>(null)
const itemError = ref('')

const metodoPagoCobro = ref<MetodoPago>('efectivo')
const showConfirmCobro = ref(false)
const isCobrando = ref(false)
const cobroError = ref('')

const showConfirmDescartar = ref(false)
const isDescartando = ref(false)
const descartarError = ref('')

onMounted(() => {
  loadProductos()
  loadCategorias()
})

const productosFiltrados = computed<Producto[]>(() => {
  const texto = search.value.trim().toLowerCase()
  return productos.value.filter((p) => {
    const matchTexto = !texto || p.nombre.toLowerCase().includes(texto)
    const matchCategoria = categoriaFiltro.value === '' || p.categoria_id === categoriaFiltro.value
    return matchTexto && matchCategoria && p.estado === 'disponible'
  })
})

function productoNombre(productoId: number): string {
  return productos.value.find((p) => p.id === productoId)?.nombre ?? `Producto #${productoId}`
}

const cantidadItems = computed(() =>
  ventaActual.value.items.reduce((acc, item) => acc + item.cantidad, 0),
)

const puedeCobrar = computed(() => ventaActual.value.items.length > 0)

const resumenCobro = computed(() => {
  const items = cantidadItems.value
  const itemsLabel = `${items} producto${items === 1 ? '' : 's'}`
  const metodoLabel = metodoPagoCobro.value === 'efectivo' ? 'Efectivo' : 'Transferencia'
  return `${itemsLabel} · Total ${formatCOP(ventaActual.value.total)} · ${props.mesaNombre} · ${metodoLabel}`
})

async function onAgregarProducto(producto: Producto) {
  addError.value = ''
  addingProductoId.value = producto.id
  try {
    ventaActual.value = await agregarItems(ventaActual.value.id, {
      items: [{ producto_id: producto.id, cantidad: 1 }],
    })
  } catch (err) {
    addError.value = messageFor(err, 'No fue posible agregar el producto.')
  } finally {
    addingProductoId.value = null
  }
}

async function onQuitarItem(itemId: number) {
  itemError.value = ''
  busyItemId.value = itemId
  try {
    ventaActual.value = await quitarItem(ventaActual.value.id, itemId)
  } catch (err) {
    itemError.value = messageFor(err, 'No fue posible quitar el producto.')
  } finally {
    busyItemId.value = null
  }
}

/** Botones − / + de cada línea; bajar de 1 quita la línea, igual que el carrito. */
async function onCambiarCantidad(item: VentaItem, delta: number) {
  const nuevaCantidad = item.cantidad + delta
  if (nuevaCantidad < 1) {
    await onQuitarItem(item.id)
    return
  }
  itemError.value = ''
  busyItemId.value = item.id
  try {
    ventaActual.value = await cambiarCantidadItem(ventaActual.value.id, item.id, {
      cantidad: nuevaCantidad,
    })
  } catch (err) {
    itemError.value = messageFor(err, 'No fue posible cambiar la cantidad.')
  } finally {
    busyItemId.value = null
  }
}

function onCerrarPanel() {
  emit('close')
}

function onIniciarCobro() {
  if (!puedeCobrar.value) return
  cobroError.value = ''
  showConfirmCobro.value = true
}

function cancelCobro() {
  showConfirmCobro.value = false
}

async function confirmarCobro() {
  isCobrando.value = true
  cobroError.value = ''
  try {
    await cerrarPedido(ventaActual.value.id, { metodo_pago: metodoPagoCobro.value })
    showConfirmCobro.value = false
    pushToast('Mesa cobrada y cerrada')
    emit('settled')
  } catch (err) {
    cobroError.value = messageFor(err, 'No fue posible cobrar el pedido.')
  } finally {
    isCobrando.value = false
  }
}

function onIniciarDescartar() {
  descartarError.value = ''
  showConfirmDescartar.value = true
}

function cancelDescartar() {
  showConfirmDescartar.value = false
}

async function confirmarDescartar() {
  isDescartando.value = true
  descartarError.value = ''
  try {
    await descartarPedido(ventaActual.value.id)
    showConfirmDescartar.value = false
    pushToast('Pedido descartado')
    emit('settled')
  } catch (err) {
    descartarError.value = messageFor(err, 'No fue posible descartar el pedido.')
  } finally {
    isDescartando.value = false
  }
}
</script>

<template>
  <BaseModal @close="onCerrarPanel">
    <div class="pedido-panel">
      <header class="pedido-header">
        <div>
          <h2>{{ mesaNombre }}</h2>
          <span class="pedido-subtitulo">Pedido en curso · #{{ ventaActual.id }}</span>
        </div>
        <span class="pedido-total">{{ formatCOP(ventaActual.total) }}</span>
      </header>

      <section class="pedido-items">
        <h3>Productos pedidos</h3>
        <p v-if="ventaActual.items.length === 0" class="status">
          Todavía no se ha agregado ningún producto.
        </p>
        <ul v-else class="items-lineas">
          <li v-for="item in ventaActual.items" :key="item.id" class="item-linea">
            <div class="item-linea-info">
              <span class="item-linea-nombre">{{ productoNombre(item.producto_id) }}</span>
              <span class="item-linea-precio">{{ formatCOP(item.precio_unitario) }} c/u</span>
            </div>
            <div class="item-linea-controls">
              <div class="item-linea-cantidad">
                <button
                  type="button"
                  class="btn-qty"
                  :disabled="busyItemId === item.id"
                  aria-label="Quitar uno"
                  @click="onCambiarCantidad(item, -1)"
                >
                  −
                </button>
                <span class="item-linea-cantidad-valor">{{ item.cantidad }}</span>
                <button
                  type="button"
                  class="btn-qty"
                  :disabled="busyItemId === item.id"
                  aria-label="Agregar uno"
                  @click="onCambiarCantidad(item, 1)"
                >
                  +
                </button>
              </div>
              <span class="item-linea-subtotal">
                {{ formatCOP(item.precio_unitario * item.cantidad) }}
              </span>
              <button
                type="button"
                class="btn-icon btn-icon--danger"
                :disabled="busyItemId === item.id"
                :aria-busy="busyItemId === item.id"
                aria-label="Quitar producto"
                title="Quitar producto"
                @click="onQuitarItem(item.id)"
              >
                <IconTrash />
              </button>
            </div>
          </li>
        </ul>
        <p v-if="itemError" class="error error--inline" role="alert">{{ itemError }}</p>
      </section>

      <section class="pedido-catalogo">
        <h3>Agregar producto</h3>
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="Buscar producto por nombre…"
        />
        <div class="categoria-chips" role="radiogroup" aria-label="Filtrar por categoría">
          <button
            type="button"
            class="categoria-chip"
            role="radio"
            :aria-checked="categoriaFiltro === ''"
            :class="{ 'categoria-chip--active': categoriaFiltro === '' }"
            @click="categoriaFiltro = ''"
          >
            Todas
          </button>
          <button
            v-for="categoria in categorias"
            :key="categoria.id"
            type="button"
            class="categoria-chip"
            role="radio"
            :aria-checked="categoriaFiltro === categoria.id"
            :class="{ 'categoria-chip--active': categoriaFiltro === categoria.id }"
            @click="categoriaFiltro = categoria.id"
          >
            {{ categoria.nombre }}
          </button>
        </div>

        <p v-if="productosFiltrados.length === 0" class="status">No se encontraron productos.</p>

        <ul v-else class="catalogo-lista">
          <li v-for="producto in productosFiltrados" :key="producto.id" class="catalogo-item">
            <ProductoThumbnail :src="producto.imagen_base64" :alt="producto.nombre" variant="thumb" />
            <div class="catalogo-item-info">
              <span class="catalogo-item-nombre">{{ producto.nombre }}</span>
              <span class="catalogo-item-precio">{{ formatCOP(producto.precio) }}</span>
            </div>
            <button
              type="button"
              class="btn-agregar"
              :disabled="addingProductoId === producto.id"
              @click="onAgregarProducto(producto)"
            >
              {{ addingProductoId === producto.id ? '…' : '+' }}
            </button>
          </li>
        </ul>
        <p v-if="addError" class="error error--inline" role="alert">{{ addError }}</p>
      </section>

      <section class="pedido-cobro">
        <div class="form-row">
          <label>Método de pago</label>
          <div class="metodo-pago" role="radiogroup" aria-label="Método de pago">
            <button
              type="button"
              class="metodo-option metodo-option--efectivo"
              role="radio"
              :aria-checked="metodoPagoCobro === 'efectivo'"
              :class="{ 'metodo-option--active': metodoPagoCobro === 'efectivo' }"
              @click="metodoPagoCobro = 'efectivo'"
            >
              <IconBanknote />
              Efectivo
            </button>
            <button
              type="button"
              class="metodo-option metodo-option--transferencia"
              role="radio"
              :aria-checked="metodoPagoCobro === 'transferencia'"
              :class="{ 'metodo-option--active': metodoPagoCobro === 'transferencia' }"
              @click="metodoPagoCobro = 'transferencia'"
            >
              <IconTransfer />
              Transferencia
            </button>
          </div>
        </div>

        <p v-if="!puedeCobrar" class="status">
          Agrega al menos un producto antes de cobrar.
        </p>

        <div class="pedido-actions">
          <button type="button" class="btn-danger-outline" :disabled="isDescartando" @click="onIniciarDescartar">
            Descartar pedido
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!puedeCobrar || isCobrando"
            @click="onIniciarCobro"
          >
            Cobrar / Cerrar mesa
          </button>
        </div>

        <div class="pedido-actions pedido-actions--secondary">
          <button type="button" class="btn-secondary" @click="onCerrarPanel">Cerrar panel</button>
        </div>
      </section>
    </div>
  </BaseModal>

  <ConfirmModal
    v-if="showConfirmCobro"
    title="Cobrar mesa"
    :message="resumenCobro"
    confirm-text="Cobrar mesa"
    confirming-text="Cobrando…"
    cancel-text="Volver"
    variant="primary"
    :is-confirming="isCobrando"
    :error-message="cobroError"
    @confirm="confirmarCobro"
    @cancel="cancelCobro"
  />

  <ConfirmModal
    v-if="showConfirmDescartar"
    title="Descartar pedido"
    :message="`¿Descartar el pedido de ${mesaNombre}? Esta acción no se puede deshacer y liberará la mesa.`"
    confirm-text="Descartar pedido"
    confirming-text="Descartando…"
    cancel-text="Volver"
    :is-confirming="isDescartando"
    :error-message="descartarError"
    @confirm="confirmarDescartar"
    @cancel="cancelDescartar"
  />
</template>

<style scoped>
.pedido-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.pedido-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-soft);
}

.pedido-header h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.pedido-subtitulo {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.pedido-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-lime);
  white-space: nowrap;
}

.pedido-items h3,
.pedido-catalogo h3 {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13.5px;
}

.error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
}

.error--inline {
  margin-top: 8px;
}

.items-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.item-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);
}

.item-linea:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-linea-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-linea-nombre {
  font-size: 13.5px;
  color: var(--color-text);
}

.item-linea-precio {
  font-size: 12px;
  color: var(--color-text-muted);
}

.item-linea-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.item-linea-cantidad {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-linea-cantidad-valor {
  min-width: 18px;
  text-align: center;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
}

.btn-qty {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.btn-qty:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-linea-subtotal {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
}

.btn-icon:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.12);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon--danger {
  color: var(--color-danger);
}

.btn-icon--danger:hover:not(:disabled) {
  background: rgba(255, 77, 109, 0.14);
}

.search-input {
  width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-size: 13.5px;
  color: var(--color-text);
  margin-bottom: 10px;
}

.categoria-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.categoria-chip {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
  cursor: pointer;
  color: var(--color-cyan);
  background: rgba(0, 229, 255, 0.14);
  border: 1px solid rgba(0, 229, 255, 0.4);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.categoria-chip:hover:not(.categoria-chip--active) {
  background: rgba(0, 229, 255, 0.22);
}

.categoria-chip--active {
  color: var(--color-text);
  background: rgba(123, 44, 191, 0.35);
  border: 1px solid var(--color-border);
}

.categoria-chip:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.catalogo-lista {
  list-style: none;
  margin: 0;
  padding: 0 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.catalogo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);
}

.catalogo-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.catalogo-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.catalogo-item-nombre {
  font-size: 13.5px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalogo-item-precio {
  font-size: 12px;
  color: var(--color-lime);
}

.btn-agregar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(90deg, var(--color-purple), var(--color-purple-deep));
}

.btn-agregar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pedido-cobro {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border-soft);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.metodo-pago {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.metodo-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.metodo-option:hover:not(.metodo-option--active) {
  color: var(--color-text);
}

.metodo-option--active.metodo-option--efectivo {
  color: var(--color-bg);
  background: var(--color-lime);
}

.metodo-option--active.metodo-option--transferencia {
  color: var(--color-bg);
  background: var(--color-orange);
}

.metodo-option:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.pedido-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pedido-actions--secondary {
  justify-content: center;
}

.btn-primary {
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 13.5px;
  color: #fff;
  background: linear-gradient(90deg, var(--color-purple), var(--color-purple-deep));
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13.5px;
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
}

.btn-danger-outline {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-danger);
  background: transparent;
  border: 1px solid rgba(255, 77, 109, 0.5);
}

.btn-danger-outline:hover:not(:disabled) {
  background: rgba(255, 77, 109, 0.12);
}

.btn-danger-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
