<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useReportes } from '../composables/useReportes'
import { formatCOP } from '../utils/currency'

const {
  reporteHoy,
  isLoadingHoy,
  errorHoy,
  loadHoy,
  reporteMensual,
  isLoadingMensual,
  errorMensual,
  loadMensual,
} = useReportes()

const mesesSeleccionados = ref(12)

onMounted(() => {
  loadHoy()
  loadMensual(mesesSeleccionados.value)
})

watch(mesesSeleccionados, (meses) => {
  loadMensual(meses)
})

const porHora = computed(() => reporteHoy.value?.por_hora ?? [])
const maxHoraTotal = computed(() => Math.max(1, ...porHora.value.map((h) => h.total)))

const mesFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' })
function formatMes(anio: number, mes: number): string {
  return mesFormatter.format(new Date(anio, mes - 1, 1))
}

function formatHora(hora: number): string {
  return `${hora.toString().padStart(2, '0')}h`
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Contabilidad</h1>
    </header>

    <div class="panel">
      <header class="panel-header">
        <h2>Ventas de hoy por hora</h2>
        <span v-if="reporteHoy" class="panel-summary">
          {{ formatCOP(reporteHoy.total) }} · {{ reporteHoy.num_ventas }} ventas
        </span>
      </header>

      <p v-if="isLoadingHoy" class="status">Cargando ventas de hoy…</p>
      <p v-else-if="errorHoy" class="error" role="alert">{{ errorHoy }}</p>
      <div v-else class="hora-chart">
        <div v-for="bucket in porHora" :key="bucket.hora" class="hora-bar-wrap">
          <div
            class="hora-bar"
            :class="{ 'hora-bar--activa': bucket.total > 0 }"
            :style="{ height: `${(bucket.total / maxHoraTotal) * 100}%` }"
            :title="`${formatHora(bucket.hora)} · ${formatCOP(bucket.total)} · ${bucket.num_ventas} ventas`"
          ></div>
          <span class="hora-label">{{ bucket.hora }}</span>
        </div>
      </div>
    </div>

    <div class="panel">
      <header class="panel-header">
        <h2>Ventas mensuales</h2>
        <div class="panel-controls">
          <label for="meses-select">Rango</label>
          <select id="meses-select" v-model.number="mesesSeleccionados">
            <option :value="6">Últimos 6 meses</option>
            <option :value="12">Últimos 12 meses</option>
            <option :value="24">Últimos 24 meses</option>
          </select>
        </div>
      </header>

      <p v-if="reporteMensual" class="ytd">
        Total acumulado del año en curso: <strong>{{ formatCOP(reporteMensual.ytd_total) }}</strong>
      </p>

      <p v-if="isLoadingMensual" class="status">Cargando reporte mensual…</p>
      <p v-else-if="errorMensual" class="error" role="alert">{{ errorMensual }}</p>

      <table v-else-if="reporteMensual" class="mensual-table">
        <thead>
          <tr>
            <th>Mes</th>
            <th>Total</th>
            <th>Tickets</th>
            <th>Ticket promedio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in reporteMensual.meses" :key="`${fila.anio}-${fila.mes}`">
            <td>{{ formatMes(fila.anio, fila.mes) }}</td>
            <td>{{ formatCOP(fila.total) }}</td>
            <td>{{ fila.num_ventas }}</td>
            <td>{{ formatCOP(fila.ticket_promedio) }}</td>
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

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.panel-summary {
  font-size: 13px;
  color: var(--color-text-muted);
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-controls label {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.panel-controls select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 13px;
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

.hora-chart {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  align-items: end;
  gap: 4px;
  height: 160px;
}

.hora-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 6px;
}

.hora-bar {
  width: 100%;
  min-height: 2px;
  border-radius: 3px 3px 0 0;
  background: var(--color-border-soft);
}

.hora-bar--activa {
  background: linear-gradient(180deg, var(--color-cyan), var(--color-purple-deep));
}

.hora-label {
  font-size: 9.5px;
  color: var(--color-text-muted);
  writing-mode: horizontal-tb;
}

.ytd {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
}

.ytd strong {
  color: var(--color-lime);
}

.mensual-table {
  width: 100%;
  border-collapse: collapse;
}

.mensual-table th,
.mensual-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 13.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-soft);
}

.mensual-table th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.mensual-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
