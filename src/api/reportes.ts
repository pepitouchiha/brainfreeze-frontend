import { apiClient } from './client'
import type { Insumo, ReporteHoyOut, ReporteMensualOut, VentaPorDia } from './types'

export function getReporteHoy(): Promise<ReporteHoyOut> {
  return apiClient.get<ReporteHoyOut>('/reportes/hoy')
}

export function getReporteMensual(meses = 12): Promise<ReporteMensualOut> {
  return apiClient.get<ReporteMensualOut>(`/reportes/mensual?meses=${meses}`)
}

export function getAlertasStock(): Promise<Insumo[]> {
  return apiClient.get<Insumo[]>('/reportes/alertas-stock')
}

export interface ReporteDiarioParams {
  desde?: string
  hasta?: string
}

export function getReporteDiario(params: ReporteDiarioParams = {}): Promise<VentaPorDia[]> {
  const query = new URLSearchParams()
  if (params.desde) query.set('desde', params.desde)
  if (params.hasta) query.set('hasta', params.hasta)
  const qs = query.toString()
  return apiClient.get<VentaPorDia[]>(`/reportes/diario${qs ? `?${qs}` : ''}`)
}
