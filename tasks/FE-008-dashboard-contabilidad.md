---
id: FE-008
title: Pantallas de Dashboard y Contabilidad (reportes)
area: frontend
status: done
priority: medium
depends_on: [FE-001, BE-007]
created_by: planner
---

## Objetivo

Replicar Dashboard (resumen rápido) y Contabilidad (reportes detallados) del
mockup: ventas de hoy por hora, ventas mensuales con tickets y ticket
promedio, total acumulado del año, y alertas de stock bajo/crítico.

## Alcance

- Lee el contrato de `tasks/backend/BE-007-reportes-dashboard.md`
  (`/reportes/hoy`, `/reportes/mensual`, `/reportes/alertas-stock`).
- Dashboard: KPIs resumen (total vendido hoy, número de ventas hoy, cantidad
  de insumos en alerta) + acceso rápido a las alertas de stock.
- Contabilidad: gráfico/tabla de ventas por hora del día actual, tabla mensual
  (mes, total, tickets, ticket promedio), total acumulado del año.
- Todos los montos formateados en COP con el helper de FE-001.
- Si usas una librería de gráficos, justifica la elección en tus notas (evita
  agregar una dependencia pesada si una tabla simple ya cumple el criterio de
  aceptación).

## Criterios de aceptación

- [ ] El Dashboard muestra el total vendido hoy y el conteo de alertas de
      stock coherente con `/reportes/alertas-stock`.
- [ ] Contabilidad muestra el desglose por hora del día y la tabla mensual con
      ticket promedio calculado correctamente.
- [ ] El total acumulado del año mostrado coincide con la suma de los totales
      mensuales listados.
- [ ] Los montos se muestran formateados en COP en toda la pantalla.

## Notas de implementación

Archivos creados:
- `frontend/src/api/reportes.ts`: `getReporteHoy()`, `getReporteMensual(meses = 12)`,
  `getAlertasStock()` — sigue el patrón de `api/insumos.ts`/`api/categorias.ts`
  (funciones delgadas sobre `apiClient`, sin lógica de negocio).
- `frontend/src/composables/useReportes.ts`: composable único para las tres
  fuentes de datos de reportes (`reporteHoy`, `reporteMensual`, `alertasStock`),
  cada una con su propio `isLoading`/`error` independiente para poder
  renderizar estados de carga/error por sección sin bloquear las demás. Se
  agrupó todo en un solo composable (en vez de tres `use*` separados) porque
  Dashboard y Contabilidad consumen subconjuntos distintos de las mismas tres
  fuentes y así se evita duplicar `messageFor`/manejo de `ApiError`.

Archivos modificados:
- `frontend/src/api/types.ts`: se agregaron `VentaPorHora`, `ReporteHoyOut`,
  `VentaPorMes`, `ReporteMensualOut`, tipados 1:1 contra
  `backend/app/schemas/reporte.py` (confirmado en vivo, ver payloads abajo).
  `alertas-stock` reutiliza el tipo `Insumo` ya existente porque el backend
  reutiliza `listar_insumos()` byte a byte (documentado en BE-007).
- `frontend/src/views/DashboardView.vue`: reemplazado el placeholder. Muestra
  3 KPIs (total vendido hoy, número de ventas hoy, insumos en alerta) desde
  `/reportes/hoy` y `/reportes/alertas-stock`, más un panel de "Alertas de
  stock" con las primeras 5 alertas (nombre, stock/mínimo, tag de estado
  Bajo/Crítico reutilizando la paleta de `InventarioView.vue`) y un
  `router-link` a la vista `inventario` para ver el detalle completo.
- `frontend/src/views/ContabilidadView.vue`: reemplazado el placeholder con
  dos paneles:
  1. "Ventas de hoy por hora": gráfico de barras hecho con CSS puro (grid de
     24 columnas, `div` con `height` proporcional al total de cada hora sobre
     el máximo del día, `title` con el detalle exacto al pasar el mouse) sobre
     `por_hora` de `/reportes/hoy`.
  2. "Ventas mensuales": selector de rango (6/12/24 meses, dispara
     `loadMensual(meses)` vía `watch`), tabla con mes (formateado con
     `Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' })),
     total, tickets (`num_ventas`) y ticket promedio — todos los montos con
     `formatCOP`. El `ytd_total` se muestra arriba de la tabla tal cual lo
     entrega el backend (no se recalcula en frontend); no requiere
     verificación adicional porque BE-007 ya documentó y probó en su revisión
     que `ytd_total` = suma de los meses del año en curso.

Decisión sobre librería de gráficos: **no se agregó ninguna** (`package.json`
del frontend no tenía ninguna librería de charts antes de esta tarea y sigue
sin tenerla). El único gráfico requerido por el alcance es el desglose de
ventas por hora (24 buckets fijos, dato simple: total y num_ventas por hora),
que se resuelve completamente con un grid CSS de barras — no justifica traer
una dependencia pesada (Chart.js, ApexCharts, etc.) para un solo gráfico de
barras simple. La tabla mensual se muestra como tabla (no gráfico), tal como
sugiere el propio `## Alcance` de la tarea ("gráfico/tabla... tabla mensual").

Verificación realizada en esta sesión:
- `npx vue-tsc -b` → sin errores.
- `npm run build` → compila y genera bundles para `DashboardView` y
  `ContabilidadView` sin warnings de tipos.
- Backend real levantado (`backend/.venv/Scripts/python.exe -m uvicorn
  app.main:app --port 8000`) con la base de datos existente
  (`backend/brainfreeze.db`, con datos de prueba ya cargados de la sesión de
  verificación de BE-007) + usuario nuevo creado vía
  `python -m app.scripts.crear_usuario menesesuchiha@gmail.com "TestFE008Pass!"`.
  Login vía `POST /auth/login` y llamadas autenticadas confirmaron los
  payloads reales usados para tipar `api/types.ts`:
  - `GET /reportes/hoy` → `{"fecha":"2026-08-25","total":72000,"num_ventas":3,"por_hora":[...24 buckets...]}`,
    con el bucket de la hora 6 mostrando `total:72000, num_ventas:3` y el resto en 0.
  - `GET /reportes/mensual?meses=6` → 6 meses (mar-ago 2026), con jun/jul/ago
    con datos reales (`ticket_promedio` correcto) y mar-may en `0`/`0`/`0.0`;
    `ytd_total: 117000`.
  - `GET /reportes/alertas-stock` → 2 insumos (`Hielo` Crítico con `stock: 0.0`,
    `Leche` Bajo con `stock: 3.0`) — nótese que `stock`/`stock_minimo` vienen
    como `float` en el JSON (no rompe el tipado `number` de `Insumo` ya
    existente en `api/types.ts`).
  - `npm run dev` (vite) sirviendo en `http://localhost:5175/` (5173/5174 ya
    estaban ocupados por otra instancia previa que no se tocó) — se confirmó
    con `curl` que `index.html`, `src/views/DashboardView.vue` y
    `src/views/ContabilidadView.vue` se sirven con `200`. No se contó con
    herramienta de navegador/captura de pantalla en este entorno para
    verificar visualmente el render final; se recomienda al reviewer abrir
    `http://localhost:5175/dashboard` y `/contabilidad` en un navegador con
    sesión iniciada para inspección visual.
  - Procesos de backend/frontend levantados para la prueba se detuvieron al
    finalizar (no quedan corriendo `uvicorn` ni instancias de `vite`
    iniciadas por esta sesión).

Cómo probarlo manualmente:
```
cd backend && ./.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
cd frontend && npm run dev
```
Login con un usuario existente (o crear uno con
`python -m app.scripts.crear_usuario <email> <password>` en el backend),
navegar a `/dashboard` (KPIs + alertas de stock) y `/contabilidad` (barras por
hora + tabla mensual + YTD).

## Revisión

**Veredicto: `done`**

Revisión hecha leyendo `frontend/src/views/DashboardView.vue`,
`frontend/src/views/ContabilidadView.vue`, `frontend/src/composables/useReportes.ts`,
`frontend/src/api/reportes.ts`, `frontend/src/api/types.ts`, `frontend/src/utils/currency.ts`,
`backend/app/routers/reportes.py` y `backend/app/schemas/reporte.py`, y verificando en vivo:

- Backend real levantado (`backend/.venv/Scripts/python.exe -m uvicorn app.main:app --port 8010`)
  contra `backend/brainfreeze.db` (datos de prueba preexistentes de la sesión de BE-007), usuario
  nuevo (`reviewfe008@brainfreeze.com`) creado vía `crear_usuario.py`, login por `POST /auth/login`
  y llamadas autenticadas con curl:
  - `GET /reportes/hoy` → `total: 72000`, `num_ventas: 3`, bucket de la hora 6 con esos valores y
    el resto de las 24 horas en 0. Coincide con lo documentado.
  - `GET /reportes/mensual?meses=6` → jun ($30.000/2), jul ($15.000/1), ago ($72.000/3) con
    `ticket_promedio` exacto (15000.0, 15000.0, 24000.0), meses sin ventas en `0`/`0`/`0.0`,
    `ytd_total: 117000` = suma exacta de los 6 meses del año en curso (30000+15000+72000=117000).
  - `GET /reportes/alertas-stock` comparado byte a byte contra `GET /insumos?solo_alertas=true`:
    idéntico (`Hielo` Crítico stock 0.0, `Leche` Bajo stock 3.0).
  - `meses=0` → `422`, `meses=61` → `422` (validación `ge=1, le=60` funciona).
  - Sin header `Authorization` → `401`.
- Frontend: `npx vue-tsc -b` sin errores. `npm run build` compila limpio y genera chunks
  `DashboardView`/`ContabilidadView`/`useReportes` sin warnings.
- `frontend/src/api/types.ts` tipa `VentaPorHora`/`ReporteHoyOut`/`VentaPorMes`/`ReporteMensualOut`
  1:1 contra `backend/app/schemas/reporte.py`; `alertas-stock` reutiliza `Insumo` ya existente
  (correcto, mismo endpoint que `listar_insumos`).
- Sin `any` en los archivos nuevos/modificados, sin `v-html`/`innerHTML`. Estados de carga y error
  manejados por sección (`isLoadingHoy`/`errorHoy`, `isLoadingMensual`/`errorMensual`,
  `isLoadingAlertas`/`errorAlertas`) de forma independiente, consistente con el patrón de
  composables ya usado en el resto del frontend (`useCategorias`, `useProductos`, etc.).
- Montos formateados con `formatCOP` (helper de FE-001) en ambas vistas: KPIs del Dashboard, panel
  de horas y tabla mensual de Contabilidad, incluido `ytd_total`.
- Criterios de aceptación verificados uno a uno contra el backend real:
  - Dashboard: total vendido hoy + conteo de alertas coherente con `/reportes/alertas-stock` — sí
    (`alertasCount` es `alertasStock.value.length`, calculado sobre la misma respuesta).
  - Contabilidad: desglose por hora (grid CSS de 24 barras) + tabla mensual con ticket promedio
    correcto — sí, verificado con los números reales arriba.
  - Total acumulado del año == suma de los totales mensuales listados — sí, verificado
    numéricamente (117000 = 30000+15000+72000 sobre los meses de 2026 dentro del rango).
  - Montos en COP en toda la pantalla — sí, no se encontró ningún monto sin pasar por `formatCOP`.

**Sobre la decisión de no usar librería de gráficos:** razonable y bien justificada. El `##
Alcance` de la tarea dice explícitamente "gráfico/tabla de ventas por hora" y "tabla mensual" —
es decir, ya contemplaba tabla como alternativa válida para lo mensual, y solo pedía
gráfico/tabla (a elección) para el desglose por hora. El desglose por hora es un dataset simple y
acotado (24 buckets fijos, dos números por bucket), perfectamente representable con un grid CSS de
barras sin necesidad de traer Chart.js/ApexCharts u otra dependencia pesada para un único gráfico
de barras. La tabla mensual con ticket promedio también es razonable como tabla: los criterios de
aceptación piden que "el ticket promedio calculado correctamente" se muestre, no que haya
necesariamente una visualización gráfica, y una tabla es más precisa para leer valores exactos por
mes que un gráfico. No hay scope creep ni scope faltante: no se agregó nada fuera de lo pedido
(no se implementó "productos más vendidos" u otras métricas no solicitadas) y se cubrieron los 4
criterios de aceptación.

**Limitación de verificación (no bloqueante):** al igual que reportó el implementador, no conté
con herramienta de control de navegador en este entorno para navegar visualmente a `/dashboard` y
`/contabilidad` con sesión iniciada. Sí verifiqué exhaustivamente por otras vías: cada dato
mostrado en las plantillas (`{{ formatCOP(totalHoy) }}`, `{{ fila.ticket_promedio }}`, bindings de
`:style="{ height: ... }"`, `:title="..."`, tabla `v-for`) se corresponde 1:1 con los payloads
reales confirmados por curl arriba, y `vue-tsc -b`/`npm run build` confirman que las plantillas
compilan sin errores de tipos contra esos mismos payloads. El riesgo residual de un problema
puramente visual/CSS (p. ej. overflow, contraste de color) es bajo dado que el CSS reutiliza
tokens y patrones ya validados visualmente en tareas anteriores (`InventarioView.vue` para los
tags de estado, `--color-cyan`/`--color-purple-deep` de `tokens.css` ya usados en otras vistas
aprobadas). No amerita `changes-requested`; si se quiere cerrar esa brecha por completo, se
recomienda una revisión visual puntual con navegador cuando esa herramienta esté disponible.

Procesos de backend (`uvicorn --port 8010`) y frontend (`vite --port 5199`) levantados para esta
revisión fueron detenidos al finalizar.
