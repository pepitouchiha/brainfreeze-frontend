<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReportes } from '../composables/useReportes'
import { useVentas } from '../composables/useVentas'
import { useMesas } from '../composables/useMesas'
import { formatCOP } from '../utils/currency'

const { reporteHoy, isLoadingHoy, errorHoy, loadHoy } = useReportes()

const { ventas, isLoading: isLoadingVentas, loadError: errorVentas, load: loadVentas } = useVentas()
const { mesas, load: loadMesas } = useMesas()

onMounted(() => {
  loadHoy()
  loadVentas()
  loadMesas()
})

const totalHoy = computed(() => reporteHoy.value?.total ?? 0)
const numVentasHoy = computed(() => reporteHoy.value?.num_ventas ?? 0)
const margenHoy = computed(() => reporteHoy.value?.margen ?? 0)
const margenHoyIncompleto = computed(() => reporteHoy.value?.margen_incompleto ?? false)
const ultimasVentas = computed(() => ventas.value.filter((v) => v.estado !== 'abierta').slice(0, 5))

function mesaNombre(mesaId: number | null): string {
  if (mesaId === null) return 'Venta libre'
  return mesas.value.find((m) => m.id === mesaId)?.nombre_o_numero ?? 'Venta libre'
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Dashboard</h1>
    </header>

    <div class="kpi-grid">
      <div class="kpi-card kpi-card--lime">
        <span class="kpi-label">Total vendido hoy</span>
        <p v-if="isLoadingHoy" class="status">Cargando…</p>
        <p v-else-if="errorHoy" class="error" role="alert">{{ errorHoy }}</p>
        <span v-else class="kpi-value kpi-value--lime">{{ formatCOP(totalHoy) }}</span>
      </div>

      <div class="kpi-card kpi-card--orange">
        <span class="kpi-label">Ganancia estimada hoy</span>
        <p v-if="isLoadingHoy" class="status">Cargando…</p>
        <p v-else-if="errorHoy" class="error" role="alert">{{ errorHoy }}</p>
        <template v-else>
          <span class="kpi-value kpi-value--orange">{{ formatCOP(margenHoy) }}</span>
          <span
            v-if="margenHoyIncompleto"
            class="tag tag--parcial"
            title="Estimado parcial: algunos productos vendidos hoy no tienen costo definido, así que la ganancia real es mayor a la mostrada."
          >
            Estimado parcial
          </span>
        </template>
      </div>

      <div class="kpi-card kpi-card--cyan">
        <span class="kpi-label">Ventas de hoy</span>
        <p v-if="isLoadingHoy" class="status">Cargando…</p>
        <p v-else-if="errorHoy" class="error" role="alert">{{ errorHoy }}</p>
        <span v-else class="kpi-value kpi-value--cyan">{{ numVentasHoy }}</span>
      </div>

    </div>

    <div class="ventas-panel">
      <header class="ventas-header">
        <h2>Últimas ventas</h2>
        <router-link class="btn-link" :to="{ name: 'ventas' }">Ir a ventas</router-link>
      </header>

      <p v-if="isLoadingVentas" class="status">Cargando ventas…</p>
      <p v-else-if="errorVentas" class="error" role="alert">{{ errorVentas }}</p>
      <p v-else-if="ultimasVentas.length === 0" class="status">Todavía no hay ventas registradas.</p>

      <table v-else class="ventas-table">
        <thead>
          <tr>
            <th>Mesa</th>
            <th>Total</th>
            <th>Método de pago</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="venta in ultimasVentas" :key="venta.id">
            <td>{{ mesaNombre(venta.mesa_id) }}</td>
            <td>{{ formatCOP(venta.total) }}</td>
            <td>
              <span class="tag" :class="`tag--${venta.metodo_pago}`">
                {{ venta.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
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

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-top: 3px solid var(--color-border-soft);
}

.kpi-card--lime {
  border-top-color: var(--color-lime);
}

.kpi-card--cyan {
  border-top-color: var(--color-cyan);
}

.kpi-card--magenta {
  border-top-color: var(--color-magenta);
}

.kpi-card--orange {
  border-top-color: var(--color-orange);
}

.kpi-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.kpi-value--lime {
  color: var(--color-lime);
}

.kpi-value--cyan {
  color: var(--color-cyan);
}

.kpi-value--magenta {
  color: var(--color-magenta);
}

.kpi-value--orange {
  color: var(--color-orange);
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

.btn-link {
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
}

.tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
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

.tag--parcial {
  align-self: flex-start;
  color: var(--color-orange);
  background: rgba(255, 138, 30, 0.14);
  border: 1px solid rgba(255, 138, 30, 0.4);
  cursor: help;
}

.ventas-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.ventas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ventas-header h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.ventas-table {
  width: 100%;
  border-collapse: collapse;
}

.ventas-table th,
.ventas-table td {
  text-align: left;
  padding: 10px 12px;
  font-size: 13.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-soft);
}

.ventas-table th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.ventas-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
