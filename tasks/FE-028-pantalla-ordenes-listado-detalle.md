---
id: FE-028
title: Nueva pantalla "Órdenes" — listado, filtros y detalle de ventas (solo lectura)
area: frontend
status: done
priority: high
depends_on: [FE-001, FE-007, BE-020]
created_by: planner
---

## Objetivo

El dueño del negocio pidió poder ver todas las órdenes (ventas ya
confirmadas) y gestionarlas. Hoy no existe ninguna pantalla que liste
ventas: `VentasView.vue` (FE-007) es exclusivamente el flujo de punto de
venta (catálogo + carrito + confirmar), y aunque `GET /ventas` ya existe en
el backend y `listVentas()`/`useVentas().load()` ya existen en el frontend
(agregados por FE-011 para el feed de "ventas recientes" del Dashboard, sin
filtros), ninguna vista los usa para mostrar el listado completo con
filtros y detalle.

**Decisión de diseño de producto (tomada por el planner, documentarla tal
cual):** esto va en una **pantalla nueva y separada, "Órdenes"** (ruta
`/ordenes`, ítem propio en el sidebar), **no** como una pestaña dentro de
`VentasView.vue`. Razón: `VentasView.vue` es un flujo operativo de
caja/POS (catálogo + carrito + confirmar) pensado para crear una venta
rápido; una pantalla de gestión/historial (listar, filtrar, ver detalle,
editar, cancelar) es un caso de uso distinto (administrativo, no
transaccional) y mezclar ambos en la misma vista complicaría el POS sin
beneficio real — el mismo criterio que ya separó Dashboard/Contabilidad
(FE-008) de Ventas (FE-007) pese a leer de las mismas ventas.

Esta tarea es **solo lectura**: listado + filtros + ver detalle. Cancelar
una orden es FE-029 (depende de esta) y editar una orden es FE-030 (depende
de esta) — no se implementan aquí para mantener el alcance acotado y
revisable.

## Alcance

- Lee el contrato de `GET /ventas` documentado/extendido en
  `tasks/backend/BE-020-estado-cancelacion-venta.md` (incluye `estado:
  "activa" | "cancelada"` en cada venta, y soporta filtros opcionales
  `desde`, `hasta`, `mesa_id`, `estado` como query params).
- `frontend/src/api/types.ts`: agregar `EstadoVenta = 'activa' |
  'cancelada'` y agregar `estado: EstadoVenta` a la interfaz `Venta`
  existente (confirmar 1:1 contra `VentaOut` real del backend antes de
  tipar, no asumir).
- `frontend/src/api/ventas.ts`: extender `listVentas()` para aceptar un
  objeto opcional de filtros (`{ desde?: string; hasta?: string; mesa_id?:
  number; estado?: EstadoVenta }`) que se serializa como query params
  (mismo patrón que ya usan otras funciones de `api/*.ts` con filtros
  opcionales, ej. revisar `api/insumos.ts` para el patrón de
  `solo_alertas`). Debe seguir siendo válido llamarla sin argumentos (uso
  actual del Dashboard de FE-011 no debe romperse).
- Nueva vista `frontend/src/views/OrdenesView.vue`:
  - Tabla/lista de órdenes: id, fecha/hora (formateada), mesa (resolver
    nombre vía `useMesas`, mismo patrón ya usado por FE-011 en el feed del
    Dashboard — "Venta libre" si `mesa_id` es `null`), método de pago
    (reutilizar el mismo patrón visual de ícono/color que ya usa
    `VentasView.vue`/FE-021/FE-022/FE-023 para Efectivo/Transferencia),
    total (formateado en COP), estado (badge/tag: "Activa" vs "Cancelada",
    estilo pill consistente con `.tag--bajo`/`.tag--critico` de
    `InventarioView.vue`/`DashboardView.vue` — canceladas visualmente
    atenuadas, ej. opacidad reducida en la fila u otro tono de tag).
  - Filtros: rango de fecha (`desde`/`hasta`), mesa (select con las mesas
    de `useMesas`, incluyendo opción "Todas"), estado (Todas/Activa/
    Cancelada). Layout y estilo de filtros a criterio del implementador,
    consistente con los patrones ya usados en otras vistas (buscador +
    selects/chips de `ProductosView.vue`/`VentasView.vue`).
  - Detalle de una orden: al hacer click en una fila (o un botón "Ver
    detalle"), mostrar sus items (nombre de producto — resolver vía
    `useProductos` por `producto_id`, cantidad, precio_unitario, subtotal)
    y el total, en un modal (`BaseModal.vue` de FE-012) o un panel
    expandible — decisión del implementador.
  - Estados de carga/error (`isLoading`/`loadError`) manejados igual que el
    resto de vistas del proyecto.
  - Sin botones de "Editar"/"Cancelar" en esta tarea (ver FE-029/FE-030).
- Router: nueva ruta `path: 'ordenes', name: 'ordenes', component: () =>
  import('../views/OrdenesView.vue')` dentro del grupo de rutas protegidas
  de `frontend/src/router/index.ts` (mismo bloque que `ventas`/
  `contabilidad`).
- Sidebar: nuevo `navItem` en `frontend/src/components/layout/AppSidebar.vue`
  ("Órdenes", ícono propio simple tipo lista/recibo, acento de color a
  elección entre los ya definidos en `NavAccent`), ubicado junto a "Ventas"
  (antes o después, a criterio visual del implementador).

## Criterios de aceptación

- [ ] `frontend/src/api/types.ts` tipa `estado: EstadoVenta` en `Venta`,
      1:1 contra el `VentaOut` real del backend (con BE-020 ya
      implementado).
- [ ] `listVentas()` sigue funcionando sin argumentos (no rompe el uso
      existente del Dashboard de FE-011) y además acepta filtros opcionales
      que se traducen en query params reales contra `GET /ventas`.
- [ ] Existe la ruta `/ordenes` y un ítem "Órdenes" en el sidebar, accesible
      solo autenticado (mismo guard que el resto de rutas protegidas).
- [ ] `OrdenesView.vue` lista las órdenes existentes con id, fecha/hora,
      mesa (o "Venta libre"), método de pago, total formateado en COP y
      estado (Activa/Cancelada visualmente distinguibles).
- [ ] Filtrar por rango de fecha, por mesa y por estado reduce la lista
      mostrada de forma coherente con lo seleccionado (verificable creando
      varias órdenes con datos distintos y probando cada filtro por
      separado y combinados).
- [ ] Ver el detalle de una orden muestra sus items (producto, cantidad,
      precio unitario, subtotal) y el total coincide con la suma de los
      subtotales mostrados.
- [ ] Una orden con `estado: "cancelada"` se distingue visualmente de una
      activa en el listado.
- [ ] Estados de carga y error de la carga inicial (`GET /ventas`) se
      manejan sin dejar la pantalla en blanco ni con un error sin
      controlar en consola.
- [ ] Esta tarea no agrega ningún botón/acción de editar o cancelar una
      orden (verificable por lectura de código — eso es FE-029/FE-030).
- [ ] `npx vue-tsc -b` y `npm run build` corren sin errores.

## Notas de implementación

Implementado tal como está descrito en la tarea, sin desviaciones. Contrato
confirmado 1:1 leyendo `backend/app/schemas/venta.py` y
`backend/app/routers/ventas.py` directamente (no solo las notas de BE-020),
tras BE-020 estar `in-review`.

**Archivos tocados:**

- `frontend/src/api/types.ts`: nuevo `EstadoVenta = 'activa' | 'cancelada'`,
  campo `estado: EstadoVenta` agregado a `Venta` (confirmado 1:1 contra
  `VentaOut`).
- `frontend/src/api/ventas.ts`: `listVentas()` ahora acepta un
  `ListVentasParams` opcional (`desde`, `hasta`, `mesa_id`, `estado`) que se
  serializa como query string con `URLSearchParams` (mismo patrón que
  `listInsumos`/`solo_alertas` en `api/insumos.ts`); llamarla sin argumentos
  sigue funcionando igual que antes (usado por `DashboardView.vue`/FE-011,
  que no se tocó).
- `frontend/src/composables/useVentas.ts`: `load()` ahora reenvía
  `filters: ListVentasParams` a `listVentas`; sigue siendo válido llamar
  `load()` sin argumentos.
- `frontend/src/views/OrdenesView.vue` (nueva): listado en tabla (id, fecha
  formateada con `Intl` vía `toLocaleString('es-CO', …)`, mesa resuelta con
  `useMesas` o "Venta libre", método de pago con el mismo ícono/tag que
  `DashboardView.vue`, total con `formatCOP`, estado como tag
  activa/cancelada), filtros (inputs `type="date"` para `desde`/`hasta`,
  selects de mesa y estado, todos disparan `refrescarOrdenes()` en `@change`)
  y un modal de detalle (`BaseModal`) con los items (nombre resuelto vía
  `useProductos`, cantidad, precio unitario, subtotal) y el total. Las filas
  de órdenes canceladas se atenúan con `opacity: 0.55` (clase
  `.orden-row--cancelada`), consistente con el criterio de "canceladas
  visualmente atenuadas" del alcance. Esta tarea **no** agrega ningún botón
  de editar/cancelar (verificable leyendo el archivo — se agregan en
  FE-029/FE-030, que reutilizan y extienden este mismo componente).
- `frontend/src/router/index.ts`: nueva ruta `path: 'ordenes', name:
  'ordenes'` dentro del grupo protegido, junto a `ventas`/`contabilidad`.
- `frontend/src/components/layout/AppSidebar.vue`: nuevo `navItem` "Órdenes"
  (acento `magenta`, ícono de recibo simple) ubicado inmediatamente después
  de "Ventas".

**Cómo se probó:** backend real levantado con `uvicorn` sobre una SQLite
temporal fuera del repo (scratchpad de la sesión), `SHEETS_SYNC_ENABLED=false`,
usuario creado vía `app.scripts.crear_usuario`. Se sembraron datos vía
`curl` (categoría, 2 productos, 2 mesas, 2 ventas — una activa con mesa, una
sin mesa cancelada con `POST /ventas/{id}/cancelar`) y se verificó con
`curl` que `GET /ventas?estado=activa`, `GET /ventas?mesa_id=1` y
`GET /ventas?desde=...&hasta=...` devuelven exactamente los query params que
arma `listVentas()`. `npx vue-tsc -b` y `npm run build` corren sin errores.
Frontend (`npm run dev`) y backend detenidos y base de datos temporal
eliminada al finalizar la verificación de las 3 tareas (ver FE-030).

## Revisión

**Veredicto: `done`.**

Revisé `frontend/src/api/types.ts`, `api/ventas.ts`,
`composables/useVentas.ts`, `views/OrdenesView.vue`, `router/index.ts` y
`components/layout/AppSidebar.vue`, comparados 1:1 contra el backend real
(`backend/app/schemas/venta.py`, `backend/app/routers/ventas.py`), más
pruebas propias:

- **Consistencia de contrato verificada línea por línea:** `EstadoVenta`,
  `Venta` (con `estado`), `VentaItem`, `MetodoPago` en `types.ts` coinciden
  exactamente con `EstadoVenta`/`VentaOut`/`VentaItemOut`/`MetodoPago` del
  backend. `listVentas(params?)` serializa `desde`/`hasta`/`mesa_id`/
  `estado` como query params reales de `GET /ventas`, verificado con curl
  replicando exactamente lo que arma `filtrosActuales()` de
  `OrdenesView.vue` (`?estado=activa`, `?estado=cancelada`, `?mesa_id=2`,
  `?desde=...&hasta=...`, y sin argumentos) — todos devuelven exactamente
  lo esperado.
- `npx vue-tsc -b` y `npm run build` corren sin errores (verificado por mi
  cuenta, no solo confiado en las notas).
- Ruta `/ordenes` y nav item "Órdenes" en el sidebar confirmados en
  `router/index.ts:50-52` y `AppSidebar.vue:48`.
- Listado con id/fecha/mesa (`useMesas`, "Venta libre" si `mesa_id` es
  `null`)/método de pago (mismo patrón de ícono/tag)/total (`formatCOP`)/
  estado (tag `--activa`/`--cancelada`, fila atenuada con `opacity: 0.55`
  vía `.orden-row--cancelada`).
- Detalle en `BaseModal` con items resueltos vía `useProductos`, cantidad,
  precio unitario y subtotal; el total coincide con la suma de subtotales
  mostrados (mismos datos, sin discrepancia).
- Estados de carga/error (`ventasLoading`/`ventasError`) manejados sin
  pantalla en blanco.
- Nota: el archivo final de `OrdenesView.vue` **sí** incluye botones de
  editar/cancelar — esto es correcto y esperado, porque el archivo que se
  revisa es el resultado acumulado tras FE-029/FE-030 (que extienden este
  mismo componente, según su propio alcance); no es una desviación de
  FE-028, cuya responsabilidad (listar/filtrar/ver detalle) sigue intacta
  y correctamente separada del resto de la lógica.

No se encontraron hallazgos bloqueantes.
