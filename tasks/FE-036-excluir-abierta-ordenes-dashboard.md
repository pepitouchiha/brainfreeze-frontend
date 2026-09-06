---
id: FE-036
title: Excluir pedidos "abierta" del historial de Órdenes y del feed de ventas recientes del Dashboard
area: frontend
status: done
priority: high
depends_on: [FE-028, BE-025, BE-028]
created_by: planner
---

## Objetivo

Con BE-025, `GET /ventas` sin filtro de `estado` puede devolver ventas en
tres estados: `activa`, `cancelada` y, ahora, `abierta` (un pedido todavía
en curso, sin cobrar). `OrdenesView.vue` (FE-028) es una pantalla de
"historial de órdenes" — un pedido que todavía se está armando en una mesa
no es una orden cerrada ni cancelada, y mostrarlo mezclado ahí confundiría
al dueño del negocio (¿por qué aparece una "venta" sin método de pago y
con un total que todavía puede cambiar?). Lo mismo aplica al feed de
"ventas recientes" del Dashboard (FE-011), si consume `GET /ventas` sin
filtrar por estado. BE-028 dejó documentado, a partir de una búsqueda real
en el código, qué pantallas del frontend consumen `GET /ventas` sin filtro
— partir de esa lista en vez de asumir.

## Alcance

- Leer las notas de implementación de BE-028 para confirmar qué pantallas
  del frontend consumen `GET /ventas` sin filtro `estado` (probablemente
  `OrdenesView.vue` y el Dashboard/feed de ventas recientes de FE-011,
  pero confirmar contra lo que BE-028 encontró, no asumir).
- `OrdenesView.vue` (FE-028): excluir del listado las ventas con `estado
  === 'abierta'` (filtrar client-side tras `listVentas()`, o pasar
  explícitamente los estados deseados si el filtro de la vista ya expone
  un selector de estado — decisión de implementación). El filtro de estado
  existente en la UI (si lo hay, "Todas/Activa/Cancelada") no debe ofrecer
  "Abierta" como opción seleccionable en esta pantalla (no es un estado
  de historial).
- Feed de ventas recientes del Dashboard (revisar
  `frontend/src/views/DashboardView.vue` o donde viva ese feed, según lo
  que confirme la lectura de BE-028): mismo criterio, excluir `abierta`.
- Cualquier otro lugar que dé por hecho que `Venta.estado` es solo
  `'activa' | 'cancelada'` (ej. un `switch`/mapa de labels/colores de badge
  que no contemple `'abierta'` y quede con un caso no manejado): si no se
  ajustó ya en FE-033 al extender el tipo, ajustarlo aquí.

**No incluye (fuera de alcance):**

- Cambiar el contrato de `listVentas()`/`GET /ventas` — sigue devolviendo
  los tres estados sin filtro; el filtrado es responsabilidad de cada
  vista consumidora, tal como documentó BE-028.
- Mostrar en algún lado del frontend un listado de "mesas con pedidos en
  curso" fuera de `MesasView.vue` (FE-034 ya cubre esa necesidad en el
  lugar donde tiene sentido operativo) — no se agrega una sección nueva en
  Dashboard/Órdenes para esto.

## Criterios de aceptación

- [ ] Con al menos una venta `abierta` existente (mesa con pedido en
      curso), `OrdenesView.vue` no la muestra en su listado, en ningún
      filtro de estado disponible.
- [ ] El selector de filtro de estado de `OrdenesView.vue` (si existe) no
      ofrece "Abierta" como opción.
- [ ] El feed de ventas recientes del Dashboard tampoco muestra pedidos
      `abierta` (verificado con el mismo escenario: mesa con pedido en
      curso, sin cobrar).
- [ ] Cerrar ese pedido (`cerrarPedido`, FE-035) hace que aparezca de
      inmediato (tras refrescar) tanto en `OrdenesView.vue` como en el feed
      del Dashboard, como cualquier venta `activa` normal.
- [ ] Descartar ese pedido con items (queda `cancelada`) hace que aparezca
      en `OrdenesView.vue` como cancelada (si el filtro de estado
      seleccionado la incluye), igual que cualquier otra venta cancelada.
- [ ] `npm run build`/type-check pasa sin errores tras estos cambios (sin
      casos de `EstadoVenta` sin manejar).

## Notas de implementación

**Archivos tocados:**
- `frontend/src/views/OrdenesView.vue` — exclusión de `abierta` del listado y badges defensivos
- `frontend/src/views/DashboardView.vue` — exclusión de `abierta` del feed de ventas recientes

**Decisiones tomadas:**
1. **OrdenesView.vue:** Se creó `refrescarOrdenesSinAbierta()` que filtra client-side `ventas.value.filter((v) => v.estado !== 'abierta')` después de cargar. Todos los handlers de filtro (desde, hasta, mesa, estado) y las acciones (cancelar, editar) usan esta función.
2. **Badge defensivo:** Aunque `abierta` no debería aparecer en el listado, se actualizó el badge para manejar los 3 estados (`activa`, `cancelada`, `abierta`) con colores consistentes (naranja para `abierta`).
3. **DashboardView.vue:** Se filtró `ultimasVentas` para excluir `abierta` antes de tomar los primeros 5.
4. El filtro de estado en la UI de Órdenes no ofrece "Abierta" como opción — solo "Todas", "Activa", "Cancelada".

**Cómo probar:**
1. `npm run dev` → ir a `/mesas`, abrir una mesa (pedido `abierta`)
2. Ir a `/ordenes` → el pedido abierto NO debe aparecer en la tabla
3. Ir a `/dashboard` → el pedido abierto NO debe aparecer en "Últimas ventas"
4. Cerrar el pedido desde `/mesas` → ahora sí aparece como "activa" en `/ordenes` y `/dashboard`

## Revisión

**Veredicto: `done`**

`frontend/src/views/OrdenesView.vue`: `refrescarOrdenesSinAbierta()`
filtra `ventas.value = ventas.value.filter(v => v.estado !== 'abierta')`
tras cada carga, usada por todos los handlers de filtro y por las
acciones que refrescan el listado (cancelar/editar); el selector de
`estado` solo ofrece `Todas/Activa/Cancelada` (sin `'abierta'`); el badge
maneja los 3 estados de forma defensiva (naranja para `abierta`, aunque en
la práctica nunca se renderiza por el filtro previo).
`frontend/src/views/DashboardView.vue`: `ultimasVentas` filtra `estado !==
'abierta'` antes de `slice(0, 5)`, preservando el orden (más recientes
primero) tal como pide el criterio. Ambos archivos compilan sin `any` ni
casos de `EstadoVenta` sin manejar; `npx vue-tsc -b`/`npm run build`
verificados de nuevo por mí sin errores.

Sin hallazgos.
