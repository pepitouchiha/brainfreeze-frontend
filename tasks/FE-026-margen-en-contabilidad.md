---
id: FE-026
title: Mostrar margen/ganancia estimada en Dashboard y Contabilidad
area: frontend
status: done
priority: medium
depends_on: [FE-008, BE-018]
created_by: planner
---

## Objetivo

BE-018 agrega `margen`/`margen_incompleto` a `/reportes/hoy` y
`/reportes/mensual` (más `ytd_margen`/`ytd_margen_incompleto`). Esta tarea
muestra esa información en las pantallas que ya consumen esos reportes
(Dashboard y Contabilidad), para que el dueño vea no solo cuánto vendió sino
una estimación de cuánto ganó — dejando claro cuándo ese número es parcial
porque algunos productos vendidos todavía no tienen `costo` cargado.

## Alcance

- Lee el contrato actualizado de reportes en
  `backend/tasks/BE-018-margen-en-reportes.md` — en particular, entender
  **por qué** existe `margen_incompleto` (algunos productos vendidos no
  tienen `costo` definido, así que el margen mostrado es una subestimación
  parcial, no el margen real completo) para poder comunicarlo correctamente
  en la UI, no solo mostrar el número.
- `frontend/src/api/types.ts`: agregar `margen: number` y `margen_incompleto:
  boolean` a `ReporteHoyOut` y a `VentaPorMes`, más `ytd_margen: number` y
  `ytd_margen_incompleto: boolean` a `ReporteMensualOut`, confirmado contra
  el backend real igual que el resto de tipos de reportes.
- `DashboardView.vue`: agregar un KPI de "Ganancia estimada hoy" (o similar)
  junto al de "Total vendido hoy", usando `formatCOP`. Si
  `margen_incompleto` es `true`, mostrar una indicación visible junto al
  número (ej. un ícono/tag con tooltip, o un texto pequeño tipo "estimado,
  algunos productos sin costo definido") — no debe quedar oculto ni
  mezclado silenciosamente como si fuera un número exacto.
- `ContabilidadView.vue`:
  - Tabla mensual: agregar columna "Margen" junto a total/tickets/ticket
    promedio, con el mismo indicador de "incompleto" por fila cuando
    corresponda (ej. un asterisco o tag junto al valor de esa fila).
  - Mostrar `ytd_margen` junto a `ytd_total`, con su propio indicador si
    `ytd_margen_incompleto` es `true`.
- No incluye: agregar el desglose de margen por hora al gráfico de barras
  existente (ese gráfico ya cumple su criterio de aceptación en FE-008 con
  el total vendido; agregar margen ahí es opcional y no se pide
  explícitamente aquí — si se quiere, puede evaluarse en una iteración
  futura).
- No incluye: ninguna lógica nueva de cálculo de margen en el frontend — el
  frontend solo muestra los valores que ya vienen calculados del backend
  (`margen`, `margen_incompleto`, `ytd_margen`, `ytd_margen_incompleto`), no
  recalcula nada localmente a partir de `precio`/`costo` de productos
  individuales.

## Criterios de aceptación

- [ ] El Dashboard muestra la ganancia estimada de hoy formateada en COP.
- [ ] Cuando `margen_incompleto` es `true` en la respuesta de
      `/reportes/hoy`, el Dashboard muestra visiblemente que el número es
      parcial/estimado (no queda indistinguible de un margen completo).
- [ ] La tabla mensual de Contabilidad muestra una columna de margen por
      mes, formateada en COP, con el mismo indicador de "incompleto" cuando
      aplica para ese mes.
- [ ] `ytd_margen` se muestra junto a `ytd_total` en Contabilidad, con su
      indicador de "incompleto" cuando `ytd_margen_incompleto` es `true`.
- [ ] Ningún monto de margen se muestra sin pasar por `formatCOP` (mismo
      estándar que el resto de montos ya validado en FE-008).
- [ ] `npx vue-tsc -b` y `npm run build` sin errores de tipos tras agregar
      los campos nuevos a `ReporteHoyOut`/`VentaPorMes`/`ReporteMensualOut`.

## Notas de implementación

- Contrato confirmado contra `backend/app/schemas/reporte.py` y
  `backend/app/routers/reportes.py` (BE-018, ya `done`): `ReporteHoyOut` y
  `VentaPorMes` ganan `margen: int` + `margen_incompleto: bool`;
  `ReporteMensualOut` gana `ytd_margen: int` + `ytd_margen_incompleto: bool`.
  El backend nunca asume costo=0 para productos sin costo — los excluye de
  la suma y señaliza `*_incompleto=True`, por eso la UI debe dejar explícito
  que el número es una subestimación parcial, no el margen real completo.
- `frontend/src/api/types.ts`: agregados los 4 campos nuevos a
  `ReporteHoyOut`, `VentaPorMes` y `ReporteMensualOut`. No se tocó
  `frontend/src/api/reportes.ts` ni `useReportes.ts` porque ya devuelven el
  objeto completo tipado (`getReporteHoy`/`getReporteMensual`), sin mapeo
  manual de campos que hubiera que ampliar.
- `DashboardView.vue`: nuevo KPI "Ganancia estimada hoy" entre "Total
  vendido hoy" y "Ventas de hoy", usando `formatCOP(reporteHoy.margen)`.
  Reutiliza el mismo patrón de estados de carga/error que los KPIs
  existentes (`isLoadingHoy`/`errorHoy`). Nuevo modificador visual
  `kpi-card--orange`/`kpi-value--orange` (usa el token `--color-orange` ya
  existente en `tokens.css`, sin usar antes en ningún KPI, para
  diferenciarlo de los KPIs de venta/inventario). Cuando
  `reporteHoy.margen_incompleto` es `true`, se muestra un tag
  `tag--parcial` (mismo patrón `.tag`/`.tag--*` que ya usaba la vista para
  método de pago y alertas de stock) con texto "Estimado parcial" y
  `title` explicando por qué (productos sin costo definido) — visible,
  no solo un tooltip oculto.
- `ContabilidadView.vue`:
  - Tabla mensual: nueva columna "Margen" al final, con
    `formatCOP(fila.margen)` y, si `fila.margen_incompleto` es `true`, un
    tag `tag--parcial` ("Parcial") al lado del monto de esa fila
    específica (no afecta a otros meses).
  - El resumen YTD (antes solo `ytd_total`) ahora también muestra
    "Ganancia estimada: {{ formatCOP(ytd_margen) }}" junto al total, con su
    propio tag `tag--parcial` si `ytd_margen_incompleto` es `true`.
  - Esta vista no tenía clases `.tag`/`.tag--*` definidas (a diferencia de
    Dashboard), así que se agregaron localmente (scoped) siguiendo el mismo
    patrón visual (paleta `--color-orange`, mismo radio/padding que el
    resto de tags del proyecto).
  - No se tocó el gráfico de barras por hora (fuera de alcance, según nota
    explícita en la tarea).
- No se agregó ninguna lógica de cálculo de margen en el frontend; solo se
  muestran los valores que ya vienen calculados del backend.
- Verificado con `npx vue-tsc -b` y `npm run build` — ambos sin errores.
- Prueba manual sugerida: `npm run dev`, iniciar sesión, ir a `/` (Dashboard)
  y a Contabilidad. Para ver el estado "incompleto" en un entorno con datos
  de prueba, basta con que algún producto vendido hoy/este mes tenga
  `costo = null` (ver ProductosView, campo "Costo (opcional)"); si todos los
  productos vendidos tienen costo definido, los tags "Estimado
  parcial"/"Parcial" no aparecerán y solo se verá el monto.

## Revisión

**Veredicto: done**

Verificación realizada:

- **Tipos (`frontend/src/api/types.ts`)**: contrastados 1:1 contra
  `backend/app/schemas/reporte.py` y `backend/app/routers/reportes.py` (BE-018,
  confirmado `done`). `ReporteHoyOut` y `VentaPorMes` tienen `margen: number` +
  `margen_incompleto: boolean`; `ReporteMensualOut` tiene `ytd_margen: number` +
  `ytd_margen_incompleto: boolean`. Coincide exactamente con el backend, sin
  campos de más ni de menos. `git diff -- src/api/types.ts` confirma que el
  único cambio relevante a esta tarea es esa adición puntual (los cambios de
  `costo` en `Producto`/`ProductoCreate`/`ProductoUpdate` corresponden a
  FE-025, no a esta tarea).
- **`DashboardView.vue`**: nuevo KPI "Ganancia estimada hoy" con
  `formatCOP(margenHoy)`, mismo patrón de loading/error que los KPIs
  existentes. Cuando `margenHoyIncompleto` es `true` se renderiza un
  `<span class="tag tag--parcial">Estimado parcial</span>` — es texto visible
  en el DOM (no solo un `title` oculto detrás de hover), y desaparece
  correctamente vía `v-if` cuando el flag es `false`. Usa `--color-orange` de
  `tokens.css` (token preexistente, ya usado en `VentasView.vue:548`, ahora
  reutilizado aquí por primera vez para un KPI — consistente con lo reportado).
- **`ContabilidadView.vue`**: columna "Margen" en la tabla mensual con
  `formatCOP(fila.margen)` + tag `tag--parcial` por fila cuando
  `fila.margen_incompleto` es `true` (no afecta otras filas, cada `v-if` está
  ligado a los datos de esa fila). YTD muestra
  `formatCOP(reporteMensual.ytd_margen)` junto a `ytd_total`, con su propio tag
  condicionado a `ytd_margen_incompleto`. Las clases `.tag`/`.tag--parcial` no
  existían antes en este archivo (confirmado con `git diff`) y se agregaron
  scoped, siguiendo la misma paleta (`--color-orange`, mismo radio/padding que
  el resto del proyecto) que las ya usadas en `DashboardView.vue`.
- **Sin cálculo de margen en frontend**: revisado — todos los valores
  (`margen`, `ytd_margen`, flags `*_incompleto`) se leen directamente de la
  respuesta del backend vía `reporteHoy`/`reporteMensual` (composable
  `useReportes.ts`, sin mapeo manual); no hay ninguna operación aritmética
  sobre `precio`/`costo` en las vistas.
- **Formateo**: todo monto de margen pasa por `formatCOP` — verificado que no
  hay interpolación directa de `margen`/`ytd_margen` sin la función.
- **`git diff` de los 3 archivos tocados** (`types.ts`, `DashboardView.vue`,
  `ContabilidadView.vue`) confirma que el diff es acotado exactamente al
  alcance de la tarea, sin scope creep ni tocar el gráfico de barras por hora
  (fuera de alcance, según nota explícita).
- **Build**: corrí yo mismo `npx vue-tsc -b` (sin salida, sin errores) y
  `npm run build` (compila y genera `dist/` sin errores de tipos ni de
  build) — ambos verificados directamente, no solo confiando en lo reportado
  por implementación.

Sin hallazgos. Los 6 criterios de aceptación se cumplen.
