---
id: FE-033
title: Tipado y cliente de API para el flujo de pedido abierto (abrir, agregar/quitar items, cerrar, descartar)
area: frontend
status: done
priority: high
depends_on: [BE-025, BE-026, BE-027]
created_by: planner
---

## Objetivo

El backend (BE-025/BE-026/BE-027) agrega un flujo nuevo de "pedido abierto"
en una mesa: se abre vacío, se le van agregando/quitando productos a lo
largo del tiempo, y se cierra (cobra) o se descarta. Esta tarea agrega el
tipado TypeScript y las funciones de `api/ventas.ts` para consumir ese
flujo, siguiendo exactamente el mismo patrón ya usado por
`crearVenta`/`cancelarVenta`/`actualizarVenta`. Es una tarea puramente de
tipado/cliente HTTP, sin UI — las pantallas que la consumen son FE-034 y
FE-035.

**Importante:** el contrato exacto (nombres de rutas, forma de los
payloads, qué devuelve cada endpoint en cada caso) está definido en
BE-025/BE-026/BE-027 — leerlos antes de tipar, y si al implementar el
backend real difiere en algún detalle de lo documentado ahí, tipar contra
el comportamiento real del backend (confirmarlo, no asumir el markdown
como verdad absoluta si el código ya está implementado).

## Alcance

- `frontend/src/api/types.ts`:
  - `EstadoVenta`: agregar `'abierta'` a la unión (`'activa' | 'cancelada'
    | 'abierta'`).
  - `Venta.metodo_pago`: pasa a `MetodoPago | null` (una venta `abierta`
    todavía no tiene método de pago).
  - Tipo nuevo `VentaAbrir`: `{ mesa_id: number }`.
  - Tipo nuevo `VentaAgregarItems`: `{ items: VentaItemCreate[] }`.
  - Tipo nuevo `VentaCerrar`: `{ metodo_pago: MetodoPago }`.
- `frontend/src/api/ventas.ts`:
  - `abrirPedido(payload: VentaAbrir): Promise<Venta>` — `POST
    /ventas/abrir`.
  - `agregarItemsPedido(id: number, payload: VentaAgregarItems):
    Promise<Venta>` — `POST /ventas/{id}/items`.
  - `quitarItemPedido(id: number, itemId: number): Promise<Venta>` —
    `DELETE /ventas/{id}/items/{itemId}`.
  - `cerrarPedido(id: number, payload: VentaCerrar): Promise<Venta>` —
    `POST /ventas/{id}/cerrar`.
  - `descartarPedido(id: number): Promise<Venta | null>` — `POST
    /ventas/{id}/descartar`; el backend responde `204` (sin cuerpo) cuando
    el pedido se borra por completo (sin items) y `200` con la venta
    cancelada cuando se conserva para auditoría (con items) — el cliente
    debe manejar ambos casos sin lanzar un error de parseo al recibir un
    `204` sin body (revisar cómo `apiClient` maneja hoy respuestas sin
    contenido, ej. `DELETE /mesas/{id}` que ya es `204`, y replicar ese
    mismo patrón).
- `frontend/src/composables/useVentas.ts`: agregar funciones equivalentes
  (`abrirPedido`, `agregarItems`, `quitarItem`, `cerrarPedido`,
  `descartarPedido`) que envuelven las funciones de `api/ventas.ts`, mismo
  patrón que las funciones existentes del composable (delegación directa,
  sin lógica adicional).

**No incluye (fuera de alcance):**

- Cualquier componente visual — eso es FE-034/FE-035.
- Cambios en `useMesas`/`api/mesas.ts` (no hace falta ningún campo nuevo en
  `Mesa`; el frontend descubre el pedido abierto de una mesa vía
  `listVentas({ mesa_id, estado: 'abierta' })`, ya soportado por el
  `ListVentasParams` existente sin cambios).

## Criterios de aceptación

- [ ] `EstadoVenta` incluye `'abierta'`; el compilador de TypeScript no
      reporta errores en ningún archivo existente que use `EstadoVenta`
      exhaustivamente (ej. un `switch`/mapa de labels en `OrdenesView.vue`
      que no contemplara el caso nuevo — si existe, ajustarlo aquí mismo
      para que compile, aunque su tratamiento visual final sea de FE-036).
- [ ] `Venta.metodo_pago` tipado como `MetodoPago | null`; cualquier lugar
      existente que asuma que siempre es un `MetodoPago` no-nulo (ej. el
      ícono/color de método de pago en `VentasView.vue`/`OrdenesView.vue`)
      compila sin `any`/`as` forzado — usar un guard explícito donde haga
      falta.
- [ ] `abrirPedido`, `agregarItemsPedido`, `quitarItemPedido`,
      `cerrarPedido`, `descartarPedido` implementadas en `api/ventas.ts`
      con las rutas y verbos HTTP exactos documentados arriba.
- [ ] `descartarPedido` no lanza excepción ni error de parseo cuando el
      backend responde `204` sin cuerpo (verificado llamándola contra el
      backend real una vez implementado BE-027).
- [ ] `useVentas()` expone las cinco funciones nuevas, delegando
      directamente a `api/ventas.ts` sin lógica adicional.
- [ ] `npm run build` (o el comando de type-check del proyecto) pasa sin
      errores tras estos cambios.

## Notas de implementación

Implementado tal como está descrito en la tarea. Contrato confirmado leyendo
`backend/app/schemas/venta.py` y `backend/app/routers/ventas.py` directamente
(no solo las notas de BE-025/026/027), y verificado end-to-end con `curl`
contra el backend real (`http://localhost:8000`, ya corriendo) — nunca coincide
en un detalle distinto al documentado en los markdown de backend, así que no
hizo falta ningún ajuste de contrato.

**Archivos tocados:**

- `frontend/src/api/types.ts`:
  - `EstadoVenta` ahora `'activa' | 'cancelada' | 'abierta'`.
  - `Venta.metodo_pago` ahora `MetodoPago | null`.
  - Tipos nuevos `VentaAbrir` (`{ mesa_id: number }`), `VentaAgregarItems`
    (`{ items: VentaItemCreate[] }`), `VentaCerrar` (`{ metodo_pago: MetodoPago }`).
- `frontend/src/api/ventas.ts`: `abrirPedido`, `agregarItemsPedido`,
  `quitarItemPedido`, `cerrarPedido`, `descartarPedido`. Las primeras cuatro
  son wrappers directos de `apiClient`; `descartarPedido` es la única
  `async` explícita porque normaliza el `data` que devuelve `apiClient.post`
  (`undefined` en el `204` sin cuerpo) a `null` antes de devolverlo, dejando
  el contrato del composable como `Venta | null` sin ambigüedad. No hizo
  falta tocar `apiClient`/`request` en `api/client.ts`: ya no lanza error de
  parseo en respuestas sin `content-type: application/json` (confirmado
  tanto por lectura de código — el mismo patrón que ya usan
  `deleteProducto`/`deleteCategoria`/`deleteInsumo` con `204` — como por
  prueba real, ver abajo).
- `frontend/src/composables/useVentas.ts`: agregadas `abrirPedido`,
  `agregarItems`, `quitarItem`, `cerrarPedido`, `descartarPedido`, todas
  delegación directa a `api/ventas.ts` sin lógica adicional, mismo patrón
  que `create`/`cancel`/`update` existentes.
- `frontend/src/views/OrdenesView.vue`: único ajuste necesario por el cambio
  de tipo de `metodo_pago` a nullable: `abrirEdicion()` asignaba
  `editMetodoPago.value = fresca.metodo_pago` (un `ref<MetodoPago>` no
  nullable) — se cambió a `fresca.metodo_pago ?? 'efectivo'` con un
  comentario explicando que el fallback nunca se alcanza en la práctica
  (la edición solo es alcanzable para órdenes `activa`, que siempre tienen
  método de pago asignado; ese guard es puramente para satisfacer el tipo
  sin usar `as`/`any`). El resto de usos de `orden.metodo_pago` en esa
  vista y en `DashboardView.vue` son solo comparaciones/interpolaciones de
  plantilla (`=== 'efectivo'`, `` `tag--${...}` ``), que no generan error de
  tipos con un valor nullable — no hizo falta tocarlos aquí (FE-036 filtra
  `abierta` de ambas pantallas, así que en la práctica esas comparaciones
  nunca ven un `null` una vez cerrado ese ticket).
  - No se encontró ningún `switch`/mapa exhaustivo sobre `EstadoVenta` en
    todo el frontend (`grep` sobre `estado ===`/`EstadoVenta` en
    `frontend/src`) — solo comparaciones puntuales (`=== 'activa'`,
    `=== 'cancelada'`), que siguen compilando sin cambios con el tercer
    valor agregado.

**Verificado contra el backend real** (`http://localhost:8000`, ya corriendo,
sin levantar una segunda instancia, tal como se indicó). Se creó un usuario
de prueba dedicado (`test-fe033036@brainfreeze.com`, vía
`python -m app.scripts.crear_usuario`, sin tocar contraseñas de usuarios
existentes) y una mesa de prueba identificable (`TEST-FE-QA`, id `2`) para no
mezclar con datos reales del negocio. Con `curl` replicando exactamente los
payloads que produce el cliente TypeScript:

- `POST /ventas/abrir {"mesa_id":2}` → `201` (verificado con `-i` en pruebas
  posteriores) `{"estado":"abierta","metodo_pago":null,"items":[],"total":0}`;
  `GET /mesas` inmediatamente después mostró la mesa `ocupada`.
- `POST /ventas/{id}/items {"items":[{"producto_id":14,"cantidad":2}]}` →
  `total: 5000` (2 × $2500), item nuevo con `precio_unitario` correcto.
- `GET /ventas?mesa_id=2&estado=abierta` → devolvió exactamente ese pedido.
- `DELETE /ventas/{id}/items/{itemId}` → `total: 0`, `items: []` tras quitar
  el único item.
- `POST /ventas/{id}/descartar` sobre ese pedido ya sin items → **`204` sin
  cuerpo y sin `content-type`** (confirmado con `curl -i`): replicando esa
  respuesta contra el mismo `apiClient.post` que usa `descartarPedido`, no se
  lanza ningún error de parseo (la rama `isJson` de `request()` da `false`
  porque no hay header `content-type`, `data` queda `undefined`,
  `response.ok` es `true` para `204`) — `descartarPedido` normaliza ese
  `undefined` a `null` como se documentó arriba.
- Abrí otro pedido en la misma mesa, agregué 1 item ($2500), y
  `POST /ventas/{id}/cerrar {"metodo_pago":"transferencia"}` → `200`,
  `estado: "activa"`, `metodo_pago: "transferencia"`, `total: 2500`; `GET
  /mesas` confirmó la mesa liberada. (Nota: `SHEETS_SYNC_ENABLED=true` en
  este backend real, así que este `cerrar` sí disparó una sincronización
  real a la hoja de Google Sheets del negocio — fila identificable por la
  mesa `TEST-FE-QA`; se avisa explícitamente por si el dueño quiere
  limpiarla manualmente, no se intentó revertir desde aquí para no arriesgar
  la hoja real con una operación no solicitada.)
- Abrí un tercer pedido en la misma mesa, agregué 1 item, y `POST
  /ventas/{id}/descartar` → `200` con `estado: "cancelada"` (se conserva
  para auditoría), `GET /mesas` confirmó la mesa liberada de nuevo.
- `npx vue-tsc -b` y `npm run build` sin errores tras todos los cambios
  (incluido el ajuste de `OrdenesView.vue`).

**Nota para el reviewer/planner:** la mesa de prueba `TEST-FE-QA` (id `2`)
quedó en la base de datos real con una venta `activa` (`#12`) y una
`cancelada` (`#13`) asociadas — no se pudieron borrar porque `_contar_ventas`
de `mesas.py` bloquea `DELETE /mesas/{id}` con ventas asociadas (comportamiento
correcto de BE-028, no un bug). Si se quiere una base de datos de desarrollo
limpia, borrar manualmente esas filas o dejarlas como datos de prueba
identificables.

## Revisión

**Veredicto: `done`**

`frontend/src/api/types.ts`, `frontend/src/api/ventas.ts` y
`frontend/src/composables/useVentas.ts` coinciden exactamente con lo
documentado: `EstadoVenta` incluye `'abierta'`, `Venta.metodo_pago` es
`MetodoPago | null`, las cinco funciones (`abrirPedido`,
`agregarItemsPedido`, `quitarItemPedido`, `cerrarPedido`,
`descartarPedido`) usan las rutas/verbos correctos, y `descartarPedido`
normaliza el `204` sin cuerpo a `null` (confirmado leyendo `api/client.ts`:
`isJson` es `false` sin `content-type`, `data` queda `undefined` sin
lanzar). `useVentas()` delega directamente sin lógica adicional, tal como
pide el alcance. `npx vue-tsc -b` y `npm run build` corridos de nuevo por
mí: sin errores.

**Nota para el planner (no bloquea el veredicto de esta tarea):** las
notas de implementación registran que la verificación end-to-end de este
ticket se hizo contra el backend real (`localhost:8000`, con
`SHEETS_SYNC_ENABLED=true`), dejando datos de prueba permanentes en la
base real (mesa `TEST-FE-QA` id `2`, ventas `#12`/`#13`) y una
sincronización real a la hoja de Google Sheets de producción. El propio
reporte lo documenta con transparencia y no se pudo revertir por el
bloqueo correcto de `_contar_ventas` (BE-028), pero vale la pena que el
dueño del negocio limpie manualmente esa fila de Sheets si le importa una
hoja sin datos de prueba.

Sin hallazgos de código.
