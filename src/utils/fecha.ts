/** Zona horaria del negocio; debe coincidir con `BUSINESS_TIMEZONE` del backend. */
export const ZONA_NEGOCIO = 'America/Bogota'

/**
 * El backend serializa `creado_en` como UTC naive (sin `Z` ni offset, ver
 * backend/app/core/timezone.py). `new Date()` interpreta ese formato como
 * hora local del navegador, lo que corre la hora 5 horas: se le agrega `Z`
 * para que se lea como UTC.
 */
export function parseFechaApi(iso: string): Date {
  const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(tieneZona ? iso : `${iso}Z`)
}

/** Fecha-hora de una venta en hora del negocio, ej. "05/09/2026, 08:04 p. m.". */
export function formatFechaHora(iso: string): string {
  const fecha = parseFechaApi(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-CO', {
    timeZone: ZONA_NEGOCIO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Solo la hora de una venta en hora del negocio, ej. "08:04 p. m.". */
export function formatHora(iso: string): string {
  const fecha = parseFechaApi(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleTimeString('es-CO', {
    timeZone: ZONA_NEGOCIO,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "YYYY-MM-DD" de hoy en hora del negocio (para inputs `type="date"`). */
export function hoyNegocio(): string {
  // en-CA formatea como YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO })
}

/** Suma `dias` a una fecha "YYYY-MM-DD" sin pasar por zonas horarias. */
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const d = new Date(Date.UTC(anio, mes - 1, dia + dias))
  return d.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" a texto largo, ej. "sábado, 5 de septiembre de 2026". */
export function formatDiaLargo(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia)).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
