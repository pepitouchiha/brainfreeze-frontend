<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useVentas } from '../composables/useVentas'
import { useMesas } from '../composables/useMesas'
import { useProductos } from '../composables/useProductos'
import { useToast } from '../composables/useToast'
import { useCarrito } from '../composables/useCarrito'
import BaseModal from '../components/common/BaseModal.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import IconBanknote from '../components/icons/IconBanknote.vue'
import IconTransfer from '../components/icons/IconTransfer.vue'
import IconEye from '../components/icons/IconEye.vue'
import IconPencil from '../components/icons/IconPencil.vue'
import IconBan from '../components/icons/IconBan.vue'
import { formatCOP } from '../utils/currency'
import { formatFechaHora } from '../utils/fecha'
import type { EstadoVenta, MetodoPago, Producto, Venta, VentaUpdate } from '../api/types'

const {
  ventas,
  isLoading: ventasLoading,
  loadError: ventasError,
  load: loadVentas,
  cancel: cancelarOrden,
  getById: obtenerOrdenPorId,
  update: actualizarOrden,
  messageFor,
} = useVentas()
const { mesas, load: loadMesas } = useMesas()
const { productos, load: loadProductos } = useProductos()
const { push: pushToast } = useToast()

const desde = ref('')
const hasta = ref('')
const mesaFiltro = ref<number | ''>('')
const estadoFiltro = ref<EstadoVenta | ''>('')

const ordenSeleccionada = ref<Venta | null>(null)

const pendingCancel = ref<Venta | null>(null)
const cancelingId = ref<number | null>(null)
const cancelErrorFor = reactive<Record<number, string>>({})

const editandoOrden = ref<Venta | null>(null)
const openingEditId = ref<number | null>(null)
const editOpenErrorFor = reactive<Record<number, string>>({})
const editCarrito = useCarrito()
const editMesa = ref<number | ''>('')
const editMetodoPago = ref<MetodoPago>('efectivo')
const editProductoId = ref<number | ''>('')
const editError = ref('')
const isSavingEdit = ref(false)

function filtrosActuales() {
  return {
    desde: desde.value || undefined,
    hasta: hasta.value || undefined,
    mesa_id: mesaFiltro.value === '' ? undefined : mesaFiltro.value,
    estado: estadoFiltro.value === '' ? undefined : estadoFiltro.value,
  }
}

async function refrescarOrdenesSinAbierta() {
  await loadVentas(filtrosActuales())
  ventas.value = ventas.value.filter((v) => v.estado !== 'abierta')
}

onMounted(() => {
  refrescarOrdenesSinAbierta()
  loadMesas()
  loadProductos()
})

function mesaNombre(mesaId: number | null): string {
  if (mesaId === null) return 'Venta libre'
  return mesas.value.find((m) => m.id === mesaId)?.nombre_o_numero ?? 'Venta libre'
}

function productoNombre(productoId: number): string {
  return productos.value.find((p) => p.id === productoId)?.nombre ?? `Producto #${productoId}`
}


function verDetalle(orden: Venta) {
  ordenSeleccionada.value = orden
}

function cerrarDetalle() {
  ordenSeleccionada.value = null
}

function requestCancel(orden: Venta) {
  pendingCancel.value = orden
}

function cancelCancelacion() {
  pendingCancel.value = null
}

async function confirmCancelacion() {
  const orden = pendingCancel.value
  if (!orden) return

  delete cancelErrorFor[orden.id]
  cancelingId.value = orden.id
  try {
    await cancelarOrden(orden.id)
    pendingCancel.value = null
    if (ordenSeleccionada.value?.id === orden.id) {
      ordenSeleccionada.value = null
    }
    pushToast('Orden cancelada')
    await refrescarOrdenesSinAbierta()
    if (orden.mesa_id !== null) {
      await loadMesas()
    }
  } catch (err) {
    cancelErrorFor[orden.id] = messageFor(err, 'No fue posible cancelar la orden.')
    pendingCancel.value = null
  } finally {
    cancelingId.value = null
  }
}

function productoParaItem(productoId: number, precioUnitario: number): Producto {
  const encontrado = productos.value.find((p) => p.id === productoId)
  if (encontrado) return encontrado
  return {
    id: productoId,
    nombre: `Producto #${productoId}`,
    categoria_id: 0,
    precio: precioUnitario,
    costo: null,
    estado: 'disponible',
    sabor: null,
    tamano: null,
    imagen_base64: null,
    creado_en: '',
  }
}

async function abrirEdicion(orden: Venta) {
  ordenSeleccionada.value = null
  delete editOpenErrorFor[orden.id]
  openingEditId.value = orden.id
  try {
    const fresca = await obtenerOrdenPorId(orden.id)
    editCarrito.clear()
    editCarrito.lineas.value = fresca.items.map((item) => ({
      producto: productoParaItem(item.producto_id, item.precio_unitario),
      cantidad: item.cantidad,
    }))
    editMesa.value = fresca.mesa_id ?? ''
    // La edición solo aplica a órdenes 'activa' (ver v-if en el template),
    // que siempre tienen metodo_pago asignado; el fallback nunca se alcanza
    // en la práctica, solo evita el tipo `MetodoPago | null` de FE-033.
    editMetodoPago.value = fresca.metodo_pago ?? 'efectivo'
    editProductoId.value = ''
    editError.value = ''
    editandoOrden.value = fresca
  } catch (err) {
    editOpenErrorFor[orden.id] = messageFor(err, 'No fue posible cargar la orden para editar.')
  } finally {
    openingEditId.value = null
  }
}

function cerrarEdicion() {
  editandoOrden.value = null
  editError.value = ''
}

function onAgregarProductoEdit() {
  if (editProductoId.value === '') return
  const producto = productos.value.find((p) => p.id === editProductoId.value)
  if (producto) editCarrito.add(producto)
  editProductoId.value = ''
}

async function onGuardarEdicion() {
  const orden = editandoOrden.value
  if (!orden) return

  if (editCarrito.lineas.value.length === 0) {
    editError.value = 'Agrega al menos un producto a la orden.'
    return
  }

  isSavingEdit.value = true
  editError.value = ''
  const mesaAnterior = orden.mesa_id
  try {
    const payload: VentaUpdate = {
      items: editCarrito.toItems(),
      metodo_pago: editMetodoPago.value,
      mesa_id: editMesa.value === '' ? null : editMesa.value,
    }
    const actualizada = await actualizarOrden(orden.id, payload)
    cerrarEdicion()
    pushToast('Orden actualizada')
    await refrescarOrdenesSinAbierta()
    if (mesaAnterior !== actualizada.mesa_id) {
      await loadMesas()
    }
  } catch (err) {
    editError.value = messageFor(err, 'No fue posible guardar los cambios de la orden.')
  } finally {
    isSavingEdit.value = false
  }
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Órdenes</h1>
    </header>

    <div class="filters">
      <div class="filter-field">
        <label for="orden-desde">Desde</label>
        <input id="orden-desde" v-model="desde" type="date" @change="refrescarOrdenesSinAbierta" />
      </div>
      <div class="filter-field">
        <label for="orden-hasta">Hasta</label>
        <input id="orden-hasta" v-model="hasta" type="date" @change="refrescarOrdenesSinAbierta" />
      </div>
      <div class="filter-field">
        <label for="orden-mesa">Mesa</label>
          <select id="orden-mesa" v-model="mesaFiltro" @change="refrescarOrdenesSinAbierta">
          <option value="">Todas</option>
          <option v-for="mesa in mesas" :key="mesa.id" :value="mesa.id">
            {{ mesa.nombre_o_numero }}
          </option>
        </select>
      </div>
      <div class="filter-field">
        <label for="orden-estado">Estado</label>
          <select id="orden-estado" v-model="estadoFiltro" @change="refrescarOrdenesSinAbierta">
          <option value="">Todas</option>
          <option value="activa">Activa</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
    </div>

    <p v-if="ventasLoading" class="status">Cargando órdenes…</p>
    <p v-else-if="ventasError" class="error" role="alert">{{ ventasError }}</p>
    <p v-else-if="ventas.length === 0" class="status">No se encontraron órdenes con estos filtros.</p>

    <table v-else class="ordenes-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Mesa</th>
          <th>Método de pago</th>
          <th>Total</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="orden in ventas" :key="orden.id">
          <tr
            class="orden-row"
            :class="{ 'orden-row--cancelada': orden.estado === 'cancelada' }"
          >
            <td>#{{ orden.id }}</td>
            <td>{{ formatFechaHora(orden.creado_en) }}</td>
            <td>{{ mesaNombre(orden.mesa_id) }}</td>
            <td>
              <span class="tag" :class="`tag--${orden.metodo_pago}`">
                <IconBanknote v-if="orden.metodo_pago === 'efectivo'" />
                <IconTransfer v-else />
                {{ orden.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia' }}
              </span>
            </td>
            <td>{{ formatCOP(orden.total) }}</td>
            <td>
              <span class="tag" :class="`tag--${orden.estado}`">
                {{ orden.estado === 'activa' ? 'Activa' : orden.estado === 'cancelada' ? 'Cancelada' : 'Abierta' }}
              </span>
            </td>
            <td class="orden-acciones">
              <button
                type="button"
                class="btn-link"
                :aria-label="`Ver detalle de la orden #${orden.id}`"
                :title="`Ver detalle de la orden #${orden.id}`"
                @click="verDetalle(orden)"
              >
                <IconEye />
              </button>
              <button
                v-if="orden.estado === 'activa'"
                type="button"
                class="btn-link"
                :disabled="openingEditId === orden.id"
                :aria-busy="openingEditId === orden.id"
                :aria-label="openingEditId === orden.id ? 'Cargando orden…' : 'Editar orden'"
                :title="openingEditId === orden.id ? 'Cargando orden…' : 'Editar orden'"
                @click="abrirEdicion(orden)"
              >
                <IconPencil />
              </button>
              <button
                v-if="orden.estado === 'activa'"
                type="button"
                class="btn-link btn-link--danger"
                :disabled="cancelingId === orden.id"
                :aria-busy="cancelingId === orden.id"
                :aria-label="cancelingId === orden.id ? 'Cancelando orden…' : 'Cancelar orden'"
                :title="cancelingId === orden.id ? 'Cancelando orden…' : 'Cancelar orden'"
                @click="requestCancel(orden)"
              >
                <IconBan />
              </button>
            </td>
          </tr>
          <tr v-if="cancelErrorFor[orden.id] || editOpenErrorFor[orden.id]" class="orden-error-row">
            <td colspan="7">
              <p class="error error--inline" role="alert">
                {{ cancelErrorFor[orden.id] || editOpenErrorFor[orden.id] }}
              </p>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <BaseModal v-if="ordenSeleccionada" @close="cerrarDetalle">
      <div class="detalle">
        <h2>Orden #{{ ordenSeleccionada.id }}</h2>
        <p class="detalle-meta">
          {{ formatFechaHora(ordenSeleccionada.creado_en) }} ·
          {{ mesaNombre(ordenSeleccionada.mesa_id) }} ·
          {{ ordenSeleccionada.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia' }} ·
          <span
            class="tag"
            :class="`tag--${ordenSeleccionada.estado}`"
          >
            {{ ordenSeleccionada.estado === 'activa' ? 'Activa' : ordenSeleccionada.estado === 'cancelada' ? 'Cancelada' : 'Abierta' }}
          </span>
        </p>

        <ul class="detalle-items">
          <li v-for="item in ordenSeleccionada.items" :key="item.id" class="detalle-item">
            <span class="detalle-item-nombre">
              {{ item.cantidad }} × {{ productoNombre(item.producto_id) }}
            </span>
            <span class="detalle-item-precio">{{ formatCOP(item.precio_unitario) }} c/u</span>
            <span class="detalle-item-subtotal">
              {{ formatCOP(item.precio_unitario * item.cantidad) }}
            </span>
          </li>
        </ul>

        <div class="detalle-total">
          <span>Total</span>
          <span>{{ formatCOP(ordenSeleccionada.total) }}</span>
        </div>

        <p v-if="cancelErrorFor[ordenSeleccionada.id]" class="error error--inline" role="alert">
          {{ cancelErrorFor[ordenSeleccionada.id] }}
        </p>

        <div class="detalle-actions">
          <button
            v-if="ordenSeleccionada.estado === 'activa'"
            type="button"
            class="btn-secondary"
            :disabled="openingEditId === ordenSeleccionada.id"
            @click="abrirEdicion(ordenSeleccionada)"
          >
            {{ openingEditId === ordenSeleccionada.id ? 'Cargando…' : 'Editar orden' }}
          </button>
          <button
            v-if="ordenSeleccionada.estado === 'activa'"
            type="button"
            class="btn-danger-outline"
            :disabled="cancelingId === ordenSeleccionada.id"
            @click="requestCancel(ordenSeleccionada)"
          >
            {{ cancelingId === ordenSeleccionada.id ? 'Cancelando…' : 'Cancelar orden' }}
          </button>
          <button type="button" class="btn-secondary" @click="cerrarDetalle">Cerrar</button>
        </div>
      </div>
    </BaseModal>

    <ConfirmModal
      v-if="pendingCancel"
      title="Cancelar orden"
      :message="`¿Cancelar la orden #${pendingCancel.id} por ${formatCOP(pendingCancel.total)}? Esta acción no se puede deshacer.`"
      confirm-text="Cancelar orden"
      confirming-text="Cancelando…"
      cancel-text="Volver"
      :is-confirming="cancelingId === pendingCancel.id"
      @confirm="confirmCancelacion"
      @cancel="cancelCancelacion"
    />

    <BaseModal v-if="editandoOrden" @close="cerrarEdicion">
      <form class="edit-form" @submit.prevent="onGuardarEdicion">
        <h2>Editar orden #{{ editandoOrden.id }}</h2>

        <div class="form-row">
          <label for="edit-producto">Agregar producto</label>
          <div class="add-producto-row">
            <select id="edit-producto" v-model="editProductoId">
              <option value="">Selecciona un producto…</option>
              <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                {{ producto.nombre }} — {{ formatCOP(producto.precio) }}
              </option>
            </select>
            <button
              type="button"
              class="btn-secondary"
              :disabled="editProductoId === ''"
              @click="onAgregarProductoEdit"
            >
              Agregar
            </button>
          </div>
        </div>

        <p v-if="editCarrito.lineas.value.length === 0" class="status">
          La orden no tiene productos. Agrega al menos uno.
        </p>

        <ul v-else class="carrito-lineas">
          <li v-for="linea in editCarrito.lineas.value" :key="linea.producto.id" class="carrito-linea">
            <div class="carrito-linea-info">
              <span class="carrito-linea-nombre">{{ linea.producto.nombre }}</span>
              <span class="carrito-linea-subtotal">{{ formatCOP(editCarrito.subtotal(linea)) }}</span>
            </div>
            <div class="carrito-linea-controls">
              <button
                type="button"
                class="btn-qty"
                @click="editCarrito.decrementar(linea.producto.id)"
              >
                −
              </button>
              <span class="carrito-linea-cantidad">{{ linea.cantidad }}</span>
              <button
                type="button"
                class="btn-qty"
                @click="editCarrito.incrementar(linea.producto.id)"
              >
                +
              </button>
              <button
                type="button"
                class="btn-link btn-link--danger"
                @click="editCarrito.remove(linea.producto.id)"
              >
                Quitar
              </button>
            </div>
          </li>
        </ul>

        <div class="form-row">
          <label for="edit-mesa">Mesa</label>
          <select id="edit-mesa" v-model="editMesa">
            <option value="">Venta libre (sin mesa)</option>
            <option v-for="mesa in mesas" :key="mesa.id" :value="mesa.id">
              {{ mesa.nombre_o_numero }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label>Método de pago</label>
          <div class="metodo-pago" role="radiogroup" aria-label="Método de pago">
            <button
              type="button"
              class="metodo-option metodo-option--efectivo"
              role="radio"
              :aria-checked="editMetodoPago === 'efectivo'"
              :class="{ 'metodo-option--active': editMetodoPago === 'efectivo' }"
              @click="editMetodoPago = 'efectivo'"
            >
              <IconBanknote />
              Efectivo
            </button>
            <button
              type="button"
              class="metodo-option metodo-option--transferencia"
              role="radio"
              :aria-checked="editMetodoPago === 'transferencia'"
              :class="{ 'metodo-option--active': editMetodoPago === 'transferencia' }"
              @click="editMetodoPago = 'transferencia'"
            >
              <IconTransfer />
              Transferencia
            </button>
          </div>
        </div>

        <div class="carrito-total">
          <span>Total estimado</span>
          <span>{{ formatCOP(editCarrito.total.value) }}</span>
        </div>

        <p v-if="editError" class="error" role="alert">{{ editError }}</p>

        <div class="form-actions">
          <button type="button" class="btn-secondary" :disabled="isSavingEdit" @click="cerrarEdicion">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="isSavingEdit">
            {{ isSavingEdit ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </section>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.view-header h1 {
  margin: 0;
  font-size: 22px;
  color: var(--color-text);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.filter-field label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.filter-field input,
.filter-field select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 13.5px;
  color: var(--color-text);
}

.status {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
}

.error--inline {
  padding: 4px 0 8px;
}

.orden-error-row td {
  padding-top: 0;
}

.ordenes-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.ordenes-table th,
.ordenes-table td {
  text-align: left;
  padding: 12px 14px;
  font-size: 13.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-soft);
}

.ordenes-table th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.ordenes-table tbody tr:last-child td {
  border-bottom: none;
}

.orden-row--cancelada {
  opacity: 0.55;
}

.orden-acciones {
  text-align: right;
  white-space: nowrap;
}

.btn-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  font-size: 13px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
}

.btn-link:hover {
  background: rgba(0, 229, 255, 0.12);
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link--danger {
  color: var(--color-danger);
}

.btn-link--danger:hover:not(:disabled) {
  background: rgba(255, 77, 109, 0.14);
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

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.tag :deep(svg) {
  width: 13px;
  height: 13px;
}

.tag--efectivo {
  color: var(--color-cyan);
  background: rgba(0, 229, 255, 0.14);
  border: 1px solid rgba(0, 229, 255, 0.4);
}

.tag--transferencia {
  color: var(--color-magenta);
  background: rgba(255, 0, 127, 0.14);
  border: 1px solid rgba(255, 0, 127, 0.4);
}

.tag--activa {
  color: var(--color-lime);
  background: rgba(178, 255, 5, 0.14);
  border: 1px solid rgba(178, 255, 5, 0.4);
}

.tag--cancelada {
  color: var(--color-danger);
  background: rgba(255, 77, 109, 0.14);
  border: 1px solid rgba(255, 77, 109, 0.4);
}

.tag--abierta {
  color: var(--color-orange);
  background: rgba(255, 138, 30, 0.14);
  border: 1px solid rgba(255, 138, 30, 0.4);
}

.detalle {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detalle h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.detalle-meta {
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.detalle-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.detalle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 13.5px;
  color: var(--color-text);
}

.detalle-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detalle-item-nombre {
  flex: 1;
  min-width: 0;
}

.detalle-item-precio {
  color: var(--color-text-muted);
  font-size: 12.5px;
  white-space: nowrap;
}

.detalle-item-subtotal {
  font-weight: 600;
  white-space: nowrap;
}

.detalle-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  padding-top: 12px;
  border-top: 1px solid var(--color-border-soft);
}

.detalle-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.edit-form h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
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

.form-row select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
}

.add-producto-row {
  display: flex;
  gap: 8px;
}

.add-producto-row select {
  flex: 1;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
}

.carrito-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
}

.carrito-linea {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-soft);
}

.carrito-linea:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.carrito-linea-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.carrito-linea-nombre {
  font-size: 13.5px;
  color: var(--color-text);
}

.carrito-linea-subtotal {
  font-size: 13px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.carrito-linea-controls {
  display: flex;
  align-items: center;
  gap: 8px;
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

.carrito-linea-cantidad {
  min-width: 18px;
  text-align: center;
  font-size: 13.5px;
  color: var(--color-text);
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

.carrito-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  padding-top: 10px;
  border-top: 1px solid var(--color-border-soft);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
</style>
