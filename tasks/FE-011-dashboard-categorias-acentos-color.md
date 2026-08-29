---
id: FE-011
title: Bordes de color de acento en tarjetas (Dashboard y Categorías) y tabla de últimas ventas
area: frontend
status: done
priority: medium
depends_on: [FE-003, FE-008]
created_by: planner
---

## Objetivo

Aplicar de forma más consistente la paleta neón ya definida en `tokens.css`
(bordes superiores de color distinto por tarjeta, como en el mockup de
referencia inspeccionado por el planner) en el Dashboard y en Categorías, y
agregar al Dashboard una tabla de últimas ventas con badge de método de pago
— hoy el Dashboard solo muestra 3 tarjetas KPI con borde idéntico entre sí y
un panel de alertas de stock, sin ninguna vista de ventas recientes.

## Alcance

- `DashboardView.vue`: agregar un `border-top` de color distinto a cada
  tarjeta `.kpi-card` (hoy las 3 comparten el mismo `border`
  `--color-border-soft`), usando colores ya definidos en `tokens.css`
  (`--color-lime`, `--color-cyan`, `--color-magenta`, `--color-purple`) — no
  inventar colores nuevos, y que no se repita el mismo color en dos tarjetas
  a la vez.
- `DashboardView.vue`: agregar un panel de "últimas ventas" (las 5 más
  recientes) usando el endpoint `GET /ventas` que el backend ya expone
  (`backend/app/routers/ventas.py`, ordenado por `creado_en` descendente, sin
  necesidad de cambios de backend). Hoy `frontend/src/api/ventas.ts` solo
  tiene `crearVenta` (`POST /ventas`); agregar ahí una función `listVentas`
  (`GET /ventas`, sin filtros o con un límite si se agrega paginación del
  lado del cliente) y consumirla desde `useVentas.ts` o un composable nuevo.
  Por cada venta mostrar: mesa (resolver el nombre vía `useMesas`, igual que
  hace `VentasView.vue`, o "Venta libre" si `mesa_id` es `null`), total
  (`formatCOP`), y un badge de método de pago (`efectivo`/`tarjeta`) con
  colores distintos entre sí, reusando el patrón `.tag`/`.tag--*` ya presente
  en `ProductosView.vue`/`InventarioView.vue`.
- `CategoriasView.vue`: agregar un `border-top` en `.category-card` con el
  color propio de cada categoría (`categoria.color`, vía `:style`), como
  complemento del swatch circular que ya existe (no reemplazarlo, sumarlo).
- No incluye: tocar los endpoints de `/reportes/*` ni el backend — todo lo
  necesario para "últimas ventas" (`GET /ventas`) ya existe y solo falta
  wiring en el frontend.

## Criterios de aceptación

- [ ] Las 3 tarjetas KPI del Dashboard muestran un borde superior de color
      distinto entre sí.
- [ ] El Dashboard muestra una lista o tabla con al menos las 5 ventas más
      recientes (o todas si hay menos de 5), cada una con mesa/"Venta libre",
      total en COP, y un badge de método de pago con color distinto entre
      efectivo y tarjeta.
- [ ] Si no hay ninguna venta registrada, se muestra un mensaje explícito
      ("Todavía no hay ventas registradas." o similar) en vez de una tabla
      vacía sin contexto.
- [ ] Las tarjetas de `CategoriasView.vue` muestran un borde superior con el
      color propio de cada categoría.
- [ ] `npx vue-tsc -b` corre sin errores.

## Notas de implementación

- `frontend/src/api/ventas.ts`: se agregó `listVentas()` (`GET /ventas`, sin
  filtros — el backend ya ordena por `creado_en` descendente).
- `frontend/src/composables/useVentas.ts`: se agregó estado (`ventas`,
  `isLoading`, `loadError`) y `load()` que llama a `listVentas()`, siguiendo
  el mismo patrón que `useMesas.ts`/`useInsumos.ts`. `create`/`messageFor`
  quedan igual (usados por `VentasView.vue`, no modificada en su
  comportamiento).
- `DashboardView.vue`:
  - Cada `.kpi-card` recibe una clase modificadora (`--lime`, `--cyan`,
    `--magenta`) que fija `border-top-color` con los mismos colores que ya
    usaba cada `.kpi-value`, sin inventar colores nuevos y sin repetir
    ninguno entre las 3 tarjetas.
  - Se agregó el panel "Últimas ventas": usa `useVentas().load()` +
    `useMesas().load()` (montados junto a los reportes existentes),
    `ultimasVentas = ventas.slice(0, 5)` (el backend ya entrega orden
    descendente por fecha), resuelve el nombre de mesa vía
    `mesaNombre(venta.mesa_id)` (mismo patrón que `VentasView.vue`: busca en
    `mesas` por id, o "Venta libre" si `mesa_id` es `null` o no se
    encuentra), muestra el total con `formatCOP`, y un badge
    `.tag--efectivo` (cyan) / `.tag--tarjeta` (magenta) — reusa la clase
    `.tag` ya presente en el propio archivo. Maneja loading/error explícitos
    y el mensaje "Todavía no hay ventas registradas." cuando la lista viene
    vacía.
- `CategoriasView.vue`: cada `.category-card` ahora tiene
  `border-top: 3px solid var(--color-border-soft)` por defecto, sobreescrito
  por `:style="{ borderTopColor: categoria.color }"` — complementa el
  swatch circular existente, no lo reemplaza.
- No se tocó ningún endpoint de `/reportes/*` ni el backend.
- Archivos tocados: `frontend/src/api/ventas.ts`,
  `frontend/src/composables/useVentas.ts`, `frontend/src/views/DashboardView.vue`,
  `frontend/src/views/CategoriasView.vue`.
- Cómo probarlo: `npm run dev`, iniciar sesión y visitar `/dashboard` — ver
  las 3 tarjetas KPI con borde superior de color distinto y el panel
  "Últimas ventas" con hasta 5 filas (mesa/"Venta libre", total, badge de
  método de pago); registrar una venta libre en `/ventas` y una venta con
  tarjeta para ver ambos colores de badge. Visitar `/categorias` y confirmar
  el borde superior del color propio de cada categoría.
- `npx vue-tsc -b` corre sin errores. Verificado visualmente con capturas
  (dashboard con panel de ventas pobladas y categorías con borde de color)
  vía Puppeteer/Edge headless.

## Revisión

**Veredicto: done**

Verificado contra código y backend real:

- `backend/app/routers/ventas.py:18-32` confirma `GET /ventas` existe, sin
  parámetros obligatorios, ordenado por `Venta.creado_en.desc()` — coincide
  exactamente con lo que asume `frontend/src/api/ventas.ts` (`listVentas`) y
  `DashboardView.vue` (`ventas.slice(0, 5)` sin reordenar). El tipo `Venta`
  en `frontend/src/api/types.ts` coincide con `VentaOut` del backend.
  Endpoint auténtico, no inventado.
- `useVentas.ts` agrega `ventas`/`isLoading`/`loadError`/`load()` siguiendo
  el mismo patrón que otros composables (`useInsumos`, `useMesas`); `create`
  y `messageFor` quedan intactos para `VentasView.vue`.
- `DashboardView.vue`: las 3 `.kpi-card` tienen `border-top-color` distinto
  (lime/cyan/magenta, sin repetir, usando solo colores de `tokens.css`). El
  panel "Últimas ventas" maneja loading/error explícitos, muestra el mensaje
  "Todavía no hay ventas registradas." cuando la lista viene vacía, resuelve
  mesa vía `mesaNombre()` ("Venta libre" si `mesa_id` es `null` o no se
  encuentra), formatea el total con `formatCOP`, y usa `.tag--efectivo`
  (cyan) / `.tag--tarjeta` (magenta) — colores distintos entre sí.
- `CategoriasView.vue`: `.category-card` tiene `border-top: 3px solid
  var(--color-border-soft)` por defecto, sobreescrito por
  `:style="{ borderTopColor: categoria.color }"` — complementa el swatch
  circular existente sin reemplazarlo.
- No se tocó ningún endpoint de `/reportes/*` ni el backend, tal como pide
  el alcance.
- `npx vue-tsc -b` y `npm run build` corren sin errores (verificado en este
  entorno).

Todos los criterios de aceptación se cumplen.
