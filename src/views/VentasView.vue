<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductos } from '../composables/useProductos'
import { useCategorias } from '../composables/useCategorias'
import { useMesas } from '../composables/useMesas'
import { useCarrito } from '../composables/useCarrito'
import { useVentas } from '../composables/useVentas'
import ProductoThumbnail from '../components/common/ProductoThumbnail.vue'
import IconBanknote from '../components/icons/IconBanknote.vue'
import IconTransfer from '../components/icons/IconTransfer.vue'
import { formatCOP } from '../utils/currency'
import type { MetodoPago, Producto, Venta } from '../api/types'

interface Ticket {
  ventaId: number
  mesaNombre: string | null
  metodoPago: MetodoPago
  total: number
  lineas: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[]
}

const route = useRoute()
const router = useRouter()

const { productos, isLoading: productosLoading, loadError: productosError, load: loadProductos } =
  useProductos()
const { categorias, load: loadCategorias } = useCategorias()
const { mesas, isLoading: mesasLoading, loadError: mesasError, load: loadMesas } = useMesas()
const carrito = useCarrito()
const { create: crearVenta, messageFor } = useVentas()

const search = ref('')
const categoriaFiltro = ref<number | ''>('')
const mesaSeleccionada = ref<number | ''>('')
const metodoPago = ref<MetodoPago>('efectivo')

const isSaving = ref(false)
const saveError = ref('')
const ticket = ref<Ticket | null>(null)

const productosFiltrados = computed<Producto[]>(() => {
  const texto = search.value.trim().toLowerCase()
  return productos.value.filter((p) => {
    const matchTexto = !texto || p.nombre.toLowerCase().includes(texto)
    const matchCategoria = categoriaFiltro.value === '' || p.categoria_id === categoriaFiltro.value
    return matchTexto && matchCategoria
  })
})

const mesaSeleccionadaNombre = computed(() => {
  if (mesaSeleccionada.value === '') return null
  return mesas.value.find((m) => m.id === mesaSeleccionada.value)?.nombre_o_numero ?? null
})

onMounted(async () => {
  await Promise.all([loadCategorias(), loadMesas(), loadProductos()])

  const mesaIdQuery = route.query.mesaId
  const mesaIdRaw = Array.isArray(mesaIdQuery) ? mesaIdQuery[0] : mesaIdQuery
  const mesaIdParsed = mesaIdRaw ? Number(mesaIdRaw) : NaN
  if (!Number.isNaN(mesaIdParsed) && mesas.value.some((m) => m.id === mesaIdParsed)) {
    mesaSeleccionada.value = mesaIdParsed
  }
})

function categoriaNombre(categoriaId: number): string {
  return categorias.value.find((c) => c.id === categoriaId)?.nombre ?? 'Sin categoría'
}

function onAgregar(producto: Producto) {
  if (producto.estado !== 'disponible') return
  carrito.add(producto)
}

function resetVentaForm() {
  carrito.clear()
  metodoPago.value = 'efectivo'
  mesaSeleccionada.value = ''
  saveError.value = ''
}

function onNuevaVenta() {
  ticket.value = null
  resetVentaForm()
}

function onVolverAMesas() {
  router.push({ name: 'mesas' })
}

async function onConfirmarVenta() {
  if (carrito.lineas.value.length === 0) {
    saveError.value = 'Agrega al menos un producto al carrito.'
    return
  }

  isSaving.value = true
  saveError.value = ''
  try {
    const payload = {
      items: carrito.toItems(),
      metodo_pago: metodoPago.value,
      mesa_id: mesaSeleccionada.value === '' ? null : mesaSeleccionada.value,
    }
    const venta: Venta = await crearVenta(payload)

    ticket.value = {
      ventaId: venta.id,
      mesaNombre: mesaSeleccionadaNombre.value,
      metodoPago: venta.metodo_pago,
      total: venta.total,
      lineas: venta.items.map((item) => {
        const producto = productos.value.find((p) => p.id === item.producto_id)
        return {
          nombre: producto?.nombre ?? `Producto #${item.producto_id}`,
          cantidad: item.cantidad,
          precioUnitario: item.precio_unitario,
          subtotal: item.precio_unitario * item.cantidad,
        }
      }),
    }

    resetVentaForm()
    if (venta.mesa_id !== null) {
      await loadMesas()
    }
  } catch (err) {
    saveError.value = messageFor(err, 'No fue posible registrar la venta.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Ventas</h1>
    </header>

    <div v-if="ticket" class="ticket">
      <h2>Venta #{{ ticket.ventaId }} registrada</h2>
      <p class="ticket-meta">
        Método de pago: <strong>{{ ticket.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia' }}</strong>
        <span v-if="ticket.mesaNombre"> · Mesa: <strong>{{ ticket.mesaNombre }}</strong></span>
        <span v-else> · Venta libre</span>
      </p>

      <ul class="ticket-lineas">
        <li v-for="(linea, idx) in ticket.lineas" :key="idx">
          <span>{{ linea.cantidad }} × {{ linea.nombre }}</span>
          <span>{{ formatCOP(linea.subtotal) }}</span>
        </li>
      </ul>

      <div class="ticket-total">
        <span>Total</span>
        <span>{{ formatCOP(ticket.total) }}</span>
      </div>

      <div class="ticket-actions">
        <button type="button" class="btn-secondary" @click="onNuevaVenta">Nueva venta</button>
        <button v-if="ticket.mesaNombre" type="button" class="btn-primary" @click="onVolverAMesas">
          Volver a Mesas
        </button>
      </div>
    </div>

    <div v-else class="pos-layout">
      <div class="catalogo">
        <div class="filters">
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Buscar producto por nombre…"
          />
          <select v-model="categoriaFiltro" class="categoria-select">
            <option value="">Todas las categorías</option>
            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.nombre }}
            </option>
          </select>
        </div>

        <p v-if="productosLoading" class="status">Cargando productos…</p>
        <p v-else-if="productosError" class="error" role="alert">{{ productosError }}</p>
        <p v-else-if="productosFiltrados.length === 0" class="status">No se encontraron productos.</p>

        <ul v-else class="producto-grid">
          <li v-for="producto in productosFiltrados" :key="producto.id" class="producto-card">
            <ProductoThumbnail :src="producto.imagen_base64" :alt="producto.nombre" variant="card" />
            <div class="producto-info">
              <span class="producto-nombre">{{ producto.nombre }}</span>
              <span class="producto-categoria">{{ categoriaNombre(producto.categoria_id) }}</span>
              <span class="producto-precio">{{ formatCOP(producto.precio) }}</span>
            </div>
            <button
              type="button"
              class="btn-agregar"
              :disabled="producto.estado !== 'disponible'"
              @click="onAgregar(producto)"
            >
              {{ producto.estado === 'disponible' ? 'Agregar' : 'Agotado' }}
            </button>
          </li>
        </ul>
      </div>

      <div class="carrito-panel">
        <h2>Venta actual</h2>

        <div class="form-row">
          <label for="venta-mesa">Mesa (opcional)</label>
          <select id="venta-mesa" v-model="mesaSeleccionada" :disabled="mesasLoading">
            <option value="">Venta libre (sin mesa)</option>
            <option v-for="mesa in mesas" :key="mesa.id" :value="mesa.id">
              {{ mesa.nombre_o_numero }} ({{ mesa.estado === 'libre' ? 'Libre' : 'Ocupada' }})
            </option>
          </select>
          <p v-if="mesasError" class="error" role="alert">{{ mesasError }}</p>
        </div>

        <div class="form-row">
          <label>Método de pago</label>
          <div class="metodo-pago" role="radiogroup" aria-label="Método de pago">
            <button
              type="button"
              class="metodo-option metodo-option--efectivo"
              role="radio"
              :aria-checked="metodoPago === 'efectivo'"
              :class="{ 'metodo-option--active': metodoPago === 'efectivo' }"
              @click="metodoPago = 'efectivo'"
            >
              <IconBanknote />
              Efectivo
            </button>
            <button
              type="button"
              class="metodo-option metodo-option--transferencia"
              role="radio"
              :aria-checked="metodoPago === 'transferencia'"
              :class="{ 'metodo-option--active': metodoPago === 'transferencia' }"
              @click="metodoPago = 'transferencia'"
            >
              <IconTransfer />
              Transferencia
            </button>
          </div>
        </div>

        <p v-if="carrito.lineas.value.length === 0" class="status">El carrito está vacío.</p>

        <ul v-else class="carrito-lineas">
          <li v-for="linea in carrito.lineas.value" :key="linea.producto.id" class="carrito-linea">
            <div class="carrito-linea-info">
              <span class="carrito-linea-nombre">{{ linea.producto.nombre }}</span>
              <span class="carrito-linea-subtotal">{{ formatCOP(carrito.subtotal(linea)) }}</span>
            </div>
            <div class="carrito-linea-controls">
              <button type="button" class="btn-qty" @click="carrito.decrementar(linea.producto.id)">
                −
              </button>
              <span class="carrito-linea-cantidad">{{ linea.cantidad }}</span>
              <button type="button" class="btn-qty" @click="carrito.incrementar(linea.producto.id)">
                +
              </button>
              <button
                type="button"
                class="btn-link btn-link--danger"
                @click="carrito.remove(linea.producto.id)"
              >
                Quitar
              </button>
            </div>
          </li>
        </ul>

        <div class="carrito-total">
          <span>Total</span>
          <span>{{ formatCOP(carrito.total.value) }}</span>
        </div>

        <p v-if="saveError" class="error" role="alert">{{ saveError }}</p>

        <button
          type="button"
          class="btn-primary btn-confirmar"
          :disabled="isSaving || carrito.lineas.value.length === 0"
          @click="onConfirmarVenta"
        >
          {{ isSaving ? 'Registrando…' : 'Confirmar venta' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-header h1 {
  margin: 0;
  font-size: 22px;
  color: var(--color-text);
}

.pos-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.catalogo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 220px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
}

.categoria-select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
  min-width: 200px;
}

.status {
  color: var(--color-text-muted);
  font-size: 14px;
}

.error {
  color: var(--color-danger);
  font-size: 13px;
  margin: 0;
}

.producto-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.producto-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.producto-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.producto-nombre {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 600;
}

.producto-categoria {
  font-size: 12px;
  color: var(--color-text-muted);
}

.producto-precio {
  font-size: 13.5px;
  color: var(--color-lime);
  font-weight: 600;
}

.btn-agregar {
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: #fff;
  background: linear-gradient(90deg, var(--color-purple), var(--color-purple-deep));
}

.btn-agregar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-border);
  color: var(--color-text-muted);
}

.carrito-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  position: sticky;
  top: 20px;
}

.carrito-panel h2 {
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

.carrito-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
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

.btn-link {
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 6px;
  margin-left: auto;
}

.btn-link--danger {
  color: var(--color-danger);
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

.btn-confirmar {
  width: 100%;
  padding: 12px 16px;
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

.ticket {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  max-width: 480px;
}

.ticket h2 {
  margin: 0;
  font-size: 17px;
  color: var(--color-text);
}

.ticket-meta {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.ticket-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ticket-lineas li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;
  color: var(--color-text);
}

.ticket-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  padding-top: 12px;
  border-top: 1px solid var(--color-border-soft);
}

.ticket-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 860px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }

  .carrito-panel {
    position: static;
  }
}
</style>
