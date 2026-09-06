---
id: FE-030
title: Editar una orden existente desde la pantalla de Órdenes (items, mesa, método de pago)
area: frontend
status: done
priority: medium
depends_on: [FE-028, BE-021]
created_by: planner
---

## Objetivo

Sobre la pantalla "Órdenes" de FE-028, agregar la acción de editar una
orden activa (agregar/quitar/modificar productos, cambiar mesa, cambiar
método de pago), consumiendo `PUT /ventas/{id}` y `GET /ventas/{id}` de
BE-021.

## Alcance

- Lee el contrato de `PUT /ventas/{id}` y `GET /ventas/{id}` documentado en
  `tasks/backend/BE-021-editar-venta.md`.
- `frontend/src/api/types.ts`: agregar el tipo de payload `VentaUpdate`
  (misma forma que `VentaCreate`: `items`, `metodo_pago`, `mesa_id`),
  tipado 1:1 contra `VentaUpdate` del backend.
- `frontend/src/api/ventas.ts`:
  - `obtenerVenta(id: number): Promise<Venta>` → `GET /ventas/${id}`.
  - `actualizarVenta(id: number, payload: VentaUpdate): Promise<Venta>` →
    `PUT /ventas/${id}`.
- `frontend/src/composables/useVentas.ts`: exponer `getById`/`update`
  delgados sobre esas dos funciones, mismo patrón que `create`.
- `frontend/src/views/OrdenesView.vue` (de FE-028):
  - Botón "Editar" por orden, visible/habilitado **solo** cuando
    `orden.estado === 'activa'` (mismo criterio que "Cancelar" en FE-029 —
    no debe ser posible iniciar edición sobre una orden cancelada).
  - Al pulsar "Editar": abrir un modal (`BaseModal.vue` de FE-012) con un
    formulario de edición precargado con los datos actuales de la orden
    (items con cantidad, mesa, método de pago) — reutilizar en la medida
    de lo razonable la lógica de carrito ya existente en
    `frontend/src/composables/useCarrito.ts` (FE-007) para agregar/quitar/
    modificar cantidad de productos, en vez de reimplementar esa lógica
    desde cero (ej. inicializar el carrito con las líneas de la orden al
    abrir el modal).
  - El formulario permite: agregar un producto del catálogo (reutilizar
    `useProductos`, ya cargado por FE-028 o cargarlo aquí si hace falta),
    quitar una línea, cambiar cantidad, cambiar la mesa asociada (select
    con "Venta libre (sin mesa)" como opción, igual criterio que
    `VentasView.vue`), y cambiar el método de pago (mismo control
    segmentado ya usado en `VentasView.vue`/FE-022).
  - Al guardar: llamar a `update(id, payload)` con los items/mesa/método de
    pago resultantes del formulario (el total mostrado en el formulario
    antes de guardar es solo referencial, calculado en cliente con los
    precios ya cargados de `useProductos`; el total definitivo que se
    muestra tras guardar debe ser el que devuelve la respuesta de
    `PUT /ventas/{id}`, nunca el calculado en cliente — mismo criterio ya
    aplicado en FE-007 para `POST /ventas`).
  - Tras guardar exitosamente: cerrar el modal, toast de éxito (FE-014,
    ej. "Orden actualizada"), refrescar el listado de órdenes, y si la
    mesa cambió, refrescar `useMesas().load()`.
  - Errores del backend (ej. `409` si la orden pasó a cancelada entre que
    se abrió el modal y se guardó, `404` si un producto/mesa ya no existe)
    se muestran de forma clara dentro del modal (inline, `role="alert"`,
    mismo patrón que el resto de formularios del proyecto), sin cerrar el
    modal automáticamente para que el usuario pueda corregir y reintentar.
  - Cancelar la edición (botón "Cancelar" del modal, overlay, `Escape`) no
    debe llamar a `PUT /ventas/{id}` ni modificar nada.

## Criterios de aceptación

- [ ] El botón de editar una orden solo está disponible/habilitado para
      órdenes con `estado === 'activa'`.
- [ ] Al abrir el formulario de edición, los items/mesa/método de pago
      quedan precargados exactamente con los datos actuales de la orden
      (verificable comparando contra `GET /ventas/{id}` antes de abrir el
      modal).
- [ ] Agregar un producto, quitar uno existente, y cambiar la cantidad de
      otro dentro del formulario, y guardar, se reflejan correctamente en
      el detalle de la orden tras refrescar (coincide con lo que devuelve
      `PUT /ventas/{id}`).
- [ ] Cambiar la mesa asociada o quitarla ("Venta libre") y guardar
      funciona end-to-end; si se cambia a otra mesa, esa mesa aparece
      "Ocupada" al navegar a Mesas después de guardar.
- [ ] Cambiar el método de pago y guardar se refleja en la orden
      actualizada.
- [ ] El total mostrado tras guardar es el que devuelve el backend
      (`PUT /ventas/{id}`), no un total recalculado únicamente en cliente
      — verificable inspeccionando que el valor mostrado proviene de la
      respuesta de la llamada, no de un cálculo local independiente.
- [ ] Cancelar el formulario de edición (botón, overlay o `Escape`) no
      ejecuta ningún `PUT /ventas/{id}`.
- [ ] Un error del backend al guardar (ej. `404`/`409` simulado) se
      muestra dentro del modal sin cerrarlo automáticamente, permitiendo
      reintentar o cancelar.
- [ ] `npx vue-tsc -b` y `npm run build` corren sin errores.

## Notas de implementación

Implementado tal como está descrito en la tarea, sin desviaciones.

**Archivos tocados:**

- `frontend/src/api/types.ts`: nuevo `VentaUpdate` (misma forma que
  `VentaCreate`: `items`, `metodo_pago`, `mesa_id`), tipado 1:1 contra el
  `VentaUpdate` real del backend (confirmado leyendo
  `backend/app/schemas/venta.py`, que además extrajo `_VentaItemsBase` como
  base compartida — irrelevante para el contrato JSON, que es idéntico).
- `frontend/src/api/ventas.ts`: `obtenerVenta(id)` → `GET /ventas/${id}`,
  `actualizarVenta(id, payload)` → `PUT /ventas/${id}`.
- `frontend/src/composables/useVentas.ts`: `getById`/`update` delgados sobre
  esas dos funciones, mismo patrón que `create`/`cancel`.
- `frontend/src/views/OrdenesView.vue`: botón "Editar" por fila (solo si
  `orden.estado === 'activa'`, mismo criterio que "Cancelar"; mientras se
  precarga muestra "Cargando…" y deshabilita el botón) y un botón equivalente
  en el modal de detalle (que se cierra automáticamente al abrir edición,
  para no apilar modales). Al pulsar "Editar" se llama primero a
  `GET /ventas/{id}` (`getById`) para precargar con el estado más reciente
  de la orden (no con la copia ya cargada en el listado), tal como pide el
  criterio de aceptación; si esa carga falla, el error se muestra inline
  bajo la fila (mismo mecanismo que los errores de cancelación).
  - El modal de edición (`BaseModal`) reutiliza `useCarrito` (FE-007): al
    abrir, se inicializa `editCarrito.lineas` directamente con los items de
    la orden (resolviendo cada `producto_id` contra `useProductos`, ya
    cargado por FE-028; si un producto ya no existiera en el catálogo se
    construye un `Producto` mínimo a partir del propio item para no romper
    la edición). El formulario permite agregar un producto del catálogo
    (select + botón "Agregar", que llama a `carrito.add()`), quitar una
    línea, cambiar cantidad (+/-, reutilizando `incrementar`/`decrementar`/
    `remove` de `useCarrito`, igual UI que el carrito de `VentasView.vue`),
    cambiar la mesa (select con "Venta libre (sin mesa)", igual criterio que
    `VentasView.vue`) y cambiar el método de pago (mismo control segmentado
    con `IconBanknote`/`IconTransfer` que `VentasView.vue`/FE-022).
  - El total mostrado en el formulario antes de guardar está rotulado
    explícitamente "Total estimado" y se calcula 100% en cliente
    (`editCarrito.total`); tras guardar, el modal se cierra y el total que
    queda visible en el listado/detalle es el que devuelve
    `PUT /ventas/{id}` (`ventas.value` se repuebla vía `refrescarOrdenes()`,
    nunca se muta localmente con el cálculo del formulario).
  - Al guardar exitosamente: cierra el modal, toast "Orden actualizada"
    (`useToast`), refresca el listado, y si `mesa_id` de la respuesta difiere
    del `mesa_id` que tenía la orden antes de abrir el modal, refresca
    `useMesas().load()`.
  - Errores del backend (`404`/`409`) se muestran dentro del modal
    (`role="alert"`), sin cerrarlo, permitiendo corregir y reintentar o
    cancelar.
  - Cancelar el modal (botón "Cancelar", overlay o `Escape` vía `BaseModal`)
    no ejecuta ningún `PUT /ventas/{id}`.

**Cómo se probó:** mismo backend real (`uvicorn` + SQLite temporal del
scratchpad) usado en FE-028/FE-029. Con `curl` replicando exactamente el
payload que arma el formulario:

1. Creada una venta activa nueva (mesa 2, 1×producto A). `GET /ventas/{id}`
   confirma los datos con los que se precargaría el formulario.
2. `PUT /ventas/{id}` agregando un segundo producto, cambiando la cantidad
   del primero de 1 a 3, cambiando la mesa de 2 a 1 y el método de pago a
   transferencia → `200`, `total` recalculado en servidor (`3×8000 + 1×6000
   = 30000`, no un valor enviado por el cliente); `GET /mesas` confirma mesa
   1 `ocupada` y mesa 2 `libre` tras la edición.
3. `PUT` sobre una venta ya cancelada → `409`
   (`"No se puede editar una venta cancelada"`).
4. `PUT` con un `producto_id` inexistente (`999`) → `404`
   (`"Producto 999 no encontrado"`), y `GET /ventas/{id}` posterior confirma
   que la orden quedó exactamente igual que antes del intento (sin cambios
   parciales) — ambos casos son los que `editError` mostraría inline en el
   modal sin cerrarlo.

`npx vue-tsc -b` y `npm run build` corren sin errores. Backend (`uvicorn`) y
frontend (`npm run dev`) detenidos y la SQLite temporal del scratchpad
eliminada al finalizar la verificación de las 3 tareas (FE-028/FE-029/
FE-030); no se tocó `backend/brainfreeze.db` (ignorado por git, confirmado
con `git check-ignore`) ni ningún archivo bajo `backend/` fuera de leer el
código fuente para confirmar los contratos.

## Revisión

**Veredicto: `done`.**

Revisé `api/types.ts` (`VentaUpdate`), `api/ventas.ts`
(`obtenerVenta`/`actualizarVenta`), `composables/useVentas.ts`
(`getById`/`update`), `composables/useCarrito.ts` y el flujo de edición
completo de `views/OrdenesView.vue`:

- `VentaUpdate` en el frontend (`items`, `metodo_pago`, `mesa_id`) coincide
  1:1 con `VentaUpdate` real del backend (`schemas/venta.py`, vía
  `_VentaItemsBase`).
- Botón "Editar" solo visible/habilitado con `orden.estado === 'activa'`
  (mismo criterio que "Cancelar"), y `abrirEdicion()` llama primero a
  `GET /ventas/{id}` (`getById`) para precargar con el estado más reciente
  (no la copia ya cargada en el listado) — correcto según el criterio de
  aceptación.
- `editCarrito.lineas` se inicializa desde los items de la respuesta
  fresca (`productoParaItem` resuelve por catálogo, o arma un `Producto`
  mínimo si ya no existe) — reutiliza `useCarrito` (`add`/`incrementar`/
  `decrementar`/`remove`) en vez de reimplementar la lógica de carrito.
- Verificado con curl replicando el payload exacto del formulario:
  agregar un producto + cambiar cantidad + cambiar mesa (A→B) + cambiar
  método de pago -> `200`, `total` recalculado en **servidor**
  (`3×8000+1×6000=30000`, no un valor de cliente), `GET /mesas` confirma
  mesa vieja `libre`/mesa nueva `ocupada`. `PUT` sobre cancelada -> `409`;
  `PUT` con `producto_id` inexistente -> `404`, sin cambios parciales en
  `GET /ventas/{id}` posterior — ambos son los casos que `editError`
  mostraría inline sin cerrar el modal (confirmado por lectura de código:
  el `catch` de `onGuardarEdicion` solo asigna `editError.value`, nunca
  cierra el modal).
- El total mostrado *antes* de guardar está rotulado explícitamente "Total
  estimado" y usa `editCarrito.total` (cálculo 100% cliente); tras
  guardar, `cerrarEdicion()` + `refrescarOrdenes()` repueblan `ventas`
  desde el `GET` real — el total visible en listado/detalle después de
  guardar siempre viene de la respuesta del backend, nunca del cálculo
  local, coincidiendo con el mismo criterio que ya aplicó FE-007.
- Cancelar el modal (botón/overlay/`Escape`) solo llama a `cerrarEdicion()`
  — cero llamadas a `PUT /ventas/{id}` en ese camino (confirmado por
  lectura de código, `BaseModal` emite `close` -> `cerrarEdicion`).
- `npx vue-tsc -b` y `npm run build` sin errores (verificado).

No se encontraron hallazgos bloqueantes.
