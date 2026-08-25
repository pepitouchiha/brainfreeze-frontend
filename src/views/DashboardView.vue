<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReportes } from '../composables/useReportes'
import { formatCOP } from '../utils/currency'

const {
  reporteHoy,
  isLoadingHoy,
  errorHoy,
  loadHoy,
  alertasStock,
  isLoadingAlertas,
  errorAlertas,
  loadAlertasStock,
} = useReportes()

onMounted(() => {
  loadHoy()
  loadAlertasStock()
})

const totalHoy = computed(() => reporteHoy.value?.total ?? 0)
const numVentasHoy = computed(() => reporteHoy.value?.num_ventas ?? 0)
const alertasCount = computed(() => alertasStock.value.length)
const alertasPreview = computed(() => alertasStock.value.slice(0, 5))
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Dashboard</h1>
    </header>

    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Total vendido hoy</span>
        <p v-if="isLoadingHoy" class="status">Cargando…</p>
        <p v-else-if="errorHoy" class="error" role="alert">{{ errorHoy }}</p>
        <span v-else class="kpi-value kpi-value--lime">{{ formatCOP(totalHoy) }}</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Ventas de hoy</span>
        <p v-if="isLoadingHoy" class="status">Cargando…</p>
        <p v-else-if="errorHoy" class="error" role="alert">{{ errorHoy }}</p>
        <span v-else class="kpi-value kpi-value--cyan">{{ numVentasHoy }}</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Insumos en alerta</span>
        <p v-if="isLoadingAlertas" class="status">Cargando…</p>
        <p v-else-if="errorAlertas" class="error" role="alert">{{ errorAlertas }}</p>
        <span v-else class="kpi-value kpi-value--magenta">{{ alertasCount }}</span>
      </div>
    </div>

    <div class="alertas-panel">
      <header class="alertas-header">
        <h2>Alertas de stock</h2>
        <router-link class="btn-link" :to="{ name: 'inventario' }">Ver inventario</router-link>
      </header>

      <p v-if="isLoadingAlertas" class="status">Cargando alertas…</p>
      <p v-else-if="errorAlertas" class="error" role="alert">{{ errorAlertas }}</p>
      <p v-else-if="alertasCount === 0" class="status">No hay insumos con stock bajo o crítico.</p>

      <ul v-else class="alertas-list">
        <li v-for="insumo in alertasPreview" :key="insumo.id" class="alertas-item">
          <span class="alertas-nombre">{{ insumo.nombre }}</span>
          <span class="alertas-stock">{{ insumo.stock }} / mín. {{ insumo.stock_minimo }}</span>
          <span class="tag" :class="insumo.estado === 'Bajo' ? 'tag--bajo' : 'tag--critico'">
            {{ insumo.estado }}
          </span>
        </li>
      </ul>

      <p v-if="alertasCount > alertasPreview.length" class="alertas-mas">
        + {{ alertasCount - alertasPreview.length }} más — ver todos en inventario.
      </p>
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

.alertas-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.alertas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alertas-header h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
}

.alertas-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alertas-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border-soft);
}

.alertas-nombre {
  flex: 1;
  font-size: 13.5px;
  color: var(--color-text);
}

.alertas-stock {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.alertas-mas {
  margin: 0;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.tag--bajo {
  color: var(--color-cyan);
  background: rgba(0, 229, 255, 0.14);
  border: 1px solid rgba(0, 229, 255, 0.4);
}

.tag--critico {
  color: var(--color-danger);
  background: rgba(255, 77, 109, 0.14);
  border: 1px solid rgba(255, 77, 109, 0.4);
}
</style>
