import { apiClient } from './client'
import type { Insumo, ReporteHoyOut, ReporteMensualOut } from './types'

export function getReporteHoy(): Promise<ReporteHoyOut> {
  return apiClient.get<ReporteHoyOut>('/reportes/hoy')
}

export function getReporteMensual(meses = 12): Promise<ReporteMensualOut> {
  return apiClient.get<ReporteMensualOut>(`/reportes/mensual?meses=${meses}`)
}

export function getAlertasStock(): Promise<Insumo[]> {
  return apiClient.get<Insumo[]>('/reportes/alertas-stock')
}
