<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getReporteDiario } from '../api/reportes'
import { listVentas } from '../api/ventas'
import { useMesas } from '../composables/useMesas'
import { useProductos } from '../composables/useProductos'
import { formatCOP } from '../utils/currency'
import { formatDiaLargo, formatHora, hoyNegocio, sumarDias } from '../utils/fecha'
import type { Venta, VentaPorDia } from '../api/types'

const { mesas, load: loadMesas } = useMesas()
const { productos, load: loadProductos } = useProductos()

const hasta = ref(hoyNegocio())
const desde = ref(sumarDias(hasta.value, -29))

const dias = ref<VentaPorDia[]>([])
const isLoading = ref(false)
const loadError = ref('')

// Detalle por día: se carga al abrir un día y queda en caché mientras no
// cambie el rango.
const diaAbierto = ref<string | null>(null)
const ventasPorDia = reactive<Record<string, Venta[]>>({})
const cargandoDia = ref<string | null>(null)
const errorDia = ref('')

const totales = computed(() =>
  dias.value.reduce(
    (acc, d) => ({
      total: acc.total + d.total,
      num_ventas: acc.num_ventas + d.num_ventas,
      efectivo: acc.efectivo + d.total_efectivo,
      transferencia: acc.transferencia + d.total_transferencia,
      margen: acc.margen + d.margen,
    }),
    { total: 0, num_ventas: 0, efectivo: 0, transferencia: 0, margen: 0 },
  ),
)

const promedioDiario = computed(() =>
  dias.value.length ? totales.value.total / dias.value.length : 0,
)

async function cargarHistorial() {
  if (desde.value && hasta.value && desde.value > hasta.value) {
    loadError.value = 'La fecha "Desde" no puede ser posterior a "Hasta".'
    dias.value = []
    return
  }
  isLoading.value = true
  loadError.value = ''
  diaAbierto.value = null
  for (const key of Object.keys(ventasPorDia)) delete ventasPorDia[key]
  try {
    dias.value = await getReporteDiario({
      desde: desde.value || undefined,
      hasta: hasta.value || undefined,
    })
  } catch {
    loadError.value = 'No fue posible cargar el historial. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

function aplicarRango(numDias: number) {
  hasta.value = hoyNegocio()
  desde.value = sumarDias(hasta.value, -(numDias - 1))
  cargarHistorial()
}

async function toggleDia(fecha: string) {
  if (diaAbierto.value === fecha) {
    diaAbierto.value = null
    return
  }
  diaAbierto.value = fecha
  errorDia.value = ''
  if (ventasPorDia[fecha]) return
  cargandoDia.value = fecha
  try {
    const ventas = await listVentas({ desde: fecha, hasta: fecha, estado: 'activa' })
    ventasPorDia[fecha] = ventas
  } catch {
    errorDia.value = 'No fue posible cargar las ventas de este día.'
  } finally {
    cargandoDia.value = null
  }
}

function mesaNombre(mesaId: number | null): string {
  if (mesaId === null) return 'Venta libre'
  return mesas.value.find((m) => m.id === mesaId)?.nombre_o_numero ?? 'Venta libre'
}

function productoNombre(productoId: number): string {
  return productos.value.find((p) => p.id === productoId)?.nombre ?? `Producto #${productoId}`
}

function resumenItems(venta: Venta): string {
  return venta.items.map((i) => `${i.cantidad} × ${productoNombre(i.producto_id)}`).join(', ')
}

onMounted(() => {
  cargarHistorial()
  loadMesas()
  loadProductos()
})
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Historial de ventas</h1>
    </header>

    <div class="panel">
      <div class="filtros">
        <div class="filtro">
          <label for="historial-desde">Desde</label>
          <input id="historial-desde" v-model="desde" type="date" @change="cargarHistorial" />
        </div>
        <div class="filtro">
          <label for="historial-hasta">Hasta</label>
          <input id="historial-hasta" v-model="hasta" type="date" @change="cargarHistorial" />
        </div>
        <div class="rangos">
          <button type="button" class="chip" @click="aplicarRango(7)">7 días</button>
          <button type="button" class="chip" @click="aplicarRango(30)">30 días</button>
          <button type="button" class="chip" @click="aplicarRango(90)">90 días</button>
        </div>
      </div>

      <div v-if="!isLoading && !loadError && dias.length" class="kpis">
        <div class="kpi">
          <span class="kpi-label">Total del período</span>
          <span class="kpi-valor kpi-valor--lime">{{ formatCOP(totales.total) }}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Ventas</span>
          <span class="kpi-valor">{{ totales.num_ventas }}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Promedio por día con ventas</span>
          <span class="kpi-valor">{{ formatCOP(promedioDiario) }}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Efectivo / Transferencia</span>
          <span class="kpi-valor kpi-valor--sm">
            {{ formatCOP(totales.efectivo) }} / {{ formatCOP(totales.transferencia) }}
          </span>
        </div>
      </div>
    </div>

    <div class="panel">
      <p v-if="isLoading" class="status">Cargando historial…</p>
      <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>
      <p v-else-if="dias.length === 0" class="status">No hay ventas en este rango de fechas.</p>

      <ul v-else class="dias">
        <li v-for="dia in dias" :key="dia.fecha" class="dia" :class="{ 'dia--abierto': diaAbierto === dia.fecha }">
          <button
            type="button"
            class="dia-header"
            :aria-expanded="diaAbierto === dia.fecha"
            @click="toggleDia(dia.fecha)"
          >
            <span class="dia-fecha">{{ formatDiaLargo(dia.fecha) }}</span>
            <span class="dia-stats">
              <span class="dia-stat">
                <span class="dia-stat-label">Ventas</span>
                {{ dia.num_ventas }}
              </span>
              <span class="dia-stat">
                <span class="dia-stat-label">Efectivo</span>
                {{ formatCOP(dia.total_efectivo) }}
              </span>
              <span class="dia-stat">
                <span class="dia-stat-label">Transferencia</span>
                {{ formatCOP(dia.total_transferencia) }}
              </span>
              <span class="dia-stat">
                <span class="dia-stat-label">Ganancia</span>
                {{ formatCOP(dia.margen) }}
                <span
                  v-if="dia.margen_incompleto"
                  class="tag tag--parcial"
                  title="Estimado parcial: algunos productos vendidos este día no tienen costo definido, así que la ganancia real es mayor a la mostrada."
                >
                  Parcial
                </span>
              </span>
              <span class="dia-total">{{ formatCOP(dia.total) }}</span>
            </span>
            <span class="dia-chevron" aria-hidden="true">{{ diaAbierto === dia.fecha ? '▾' : '▸' }}</span>
          </button>

          <div v-if="diaAbierto === dia.fecha" class="dia-detalle">
            <p v-if="cargandoDia === dia.fecha" class="status">Cargando ventas…</p>
            <p v-else-if="errorDia" class="error" role="alert">{{ errorDia }}</p>
            <table v-else-if="ventasPorDia[dia.fecha]" class="ventas-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>#</th>
                  <th>Mesa</th>
                  <th>Productos</th>
                  <th>Pago</th>
                  <th class="num">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="venta in ventasPorDia[dia.fecha]" :key="venta.id">
                  <td class="nowrap">{{ formatHora(venta.creado_en) }}</td>
                  <td class="muted">{{ venta.id }}</td>
                  <td class="nowrap">{{ mesaNombre(venta.mesa_id) }}</td>
                  <td class="items">{{ resumenItems(venta) }}</td>
                  <td>
                    <span
                      class="tag"
                      :class="venta.metodo_pago === 'transferencia' ? 'tag--transferencia' : 'tag--efectivo'"
                    >
                      {{ venta.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo' }}
                    </span>
                  </td>
                  <td class="num">{{ formatCOP(venta.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </li>
      </ul>
    </div>
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

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
}

.filtro {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filtro label {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.filtro input {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 13px;
  color: var(--color-text);
  color-scheme: dark;
}

.rangos {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.chip {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  color: var(--color-cyan);
  background: rgba(0, 229, 255, 0.14);
  border: 1px solid rgba(0, 229, 255, 0.4);
}

.chip:hover {
  background: rgba(0, 229, 255, 0.22);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border-soft);
}

.kpi-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.kpi-valor {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.kpi-valor--lime {
  color: var(--color-lime);
}

.kpi-valor--sm {
  font-size: 14px;
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

.dias {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.dia {
  border-bottom: 1px solid var(--color-border-soft);
}

.dia:last-child {
  border-bottom: none;
}

.dia-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text);
  border-radius: var(--radius-sm);
}

.dia-header:hover {
  background: rgba(0, 229, 255, 0.05);
}

.dia-header:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.dia-fecha {
  flex: 1;
  min-width: 160px;
  font-size: 14px;
  font-weight: 600;
  text-transform: capitalize;
}

.dia-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
}

.dia-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
}

.dia-stat-label {
  font-size: 11.5px;
  color: var(--color-text-muted);
}

.dia-total {
  min-width: 110px;
  text-align: right;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-lime);
}

.dia-chevron {
  width: 14px;
  color: var(--color-text-muted);
}

.dia-detalle {
  padding: 0 6px 16px;
  overflow-x: auto;
}

.ventas-table {
  width: 100%;
  border-collapse: collapse;
}

.ventas-table th,
.ventas-table td {
  text-align: left;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-soft);
  vertical-align: top;
}

.ventas-table th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.ventas-table tbody tr:last-child td {
  border-bottom: none;
}

.ventas-table .num {
  text-align: right;
  white-space: nowrap;
}

.ventas-table .nowrap {
  white-space: nowrap;
}

.ventas-table .muted {
  color: var(--color-text-muted);
}

.ventas-table .items {
  color: var(--color-text-muted);
  min-width: 200px;
}

.tag {
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.tag--parcial {
  color: var(--color-orange);
  background: rgba(255, 138, 30, 0.14);
  border: 1px solid rgba(255, 138, 30, 0.4);
  cursor: help;
}

.tag--efectivo {
  color: var(--color-lime);
  background: rgba(178, 255, 5, 0.12);
  border: 1px solid rgba(178, 255, 5, 0.35);
}

.tag--transferencia {
  color: var(--color-orange);
  background: rgba(255, 138, 30, 0.14);
  border: 1px solid rgba(255, 138, 30, 0.4);
}
</style>
