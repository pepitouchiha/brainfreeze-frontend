import { ref } from 'vue'
import { getAlertasStock, getReporteHoy, getReporteMensual } from '../api/reportes'
import { ApiError } from '../api/client'
import type { Insumo, ReporteHoyOut, ReporteMensualOut } from '../api/types'

export function useReportes() {
  const reporteHoy = ref<ReporteHoyOut | null>(null)
  const isLoadingHoy = ref(false)
  const errorHoy = ref('')

  const reporteMensual = ref<ReporteMensualOut | null>(null)
  const isLoadingMensual = ref(false)
  const errorMensual = ref('')

  const alertasStock = ref<Insumo[]>([])
  const isLoadingAlertas = ref(false)
  const errorAlertas = ref('')

  async function loadHoy(): Promise<void> {
    isLoadingHoy.value = true
    errorHoy.value = ''
    try {
      reporteHoy.value = await getReporteHoy()
    } catch {
      errorHoy.value = 'No fue posible cargar las ventas de hoy. Intenta de nuevo.'
    } finally {
      isLoadingHoy.value = false
    }
  }

  async function loadMensual(meses = 12): Promise<void> {
    isLoadingMensual.value = true
    errorMensual.value = ''
    try {
      reporteMensual.value = await getReporteMensual(meses)
    } catch {
      errorMensual.value = 'No fue posible cargar el reporte mensual. Intenta de nuevo.'
    } finally {
      isLoadingMensual.value = false
    }
  }

  async function loadAlertasStock(): Promise<void> {
    isLoadingAlertas.value = true
    errorAlertas.value = ''
    try {
      alertasStock.value = await getAlertasStock()
    } catch {
      errorAlertas.value = 'No fue posible cargar las alertas de stock. Intenta de nuevo.'
    } finally {
      isLoadingAlertas.value = false
    }
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return {
    reporteHoy,
    isLoadingHoy,
    errorHoy,
    loadHoy,
    reporteMensual,
    isLoadingMensual,
    errorMensual,
    loadMensual,
    alertasStock,
    isLoadingAlertas,
    errorAlertas,
    loadAlertasStock,
    messageFor,
  }
}
