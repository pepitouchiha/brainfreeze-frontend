---
id: FE-032
title: Popup de confirmación y toast de éxito al confirmar una venta (quitar panel de ticket)
area: frontend
status: done
priority: high
depends_on: [FE-007, FE-013, FE-014, FE-028]
created_by: planner
---

## Objetivo

El dueño del negocio, usando la app, pidió que el flujo de "Confirmar
venta" de `frontend/src/views/VentasView.vue` cambie en dos puntos:

1. Hoy, al pulsar el botón `.btn-confirmar`, `onConfirmarVenta()` llama a
   `POST /ventas` **directamente**, sin ningún paso de confirmación
   previo. Se pide que aparezca antes un popup que permita revisar el
   pedido (cantidad de items, total, mesa si aplica, método de pago) antes
   de que la venta quede registrada.
2. Hoy, si `POST /ventas` tiene éxito, la vista reemplaza todo el
   catálogo/carrito por un panel `.ticket` persistente (ver
   `VentasView.vue` líneas ~142-168, con detalle de items/total y botones
   "Nueva venta"/"Volver a Mesas"). Se pide, en su lugar, mostrar un toast
   de éxito (ej. "Venta confirmada exitosamente") con la estética ya
   usada por `useToast`/`ToastContainer.vue` (FE-014), y que la vista
   quede lista para la siguiente venta (catálogo visible, carrito limpio)
   sin ningún panel de ticket separado.

**Decisión de producto ya tomada (no re-abrir esta discusión):** se quita
el panel `.ticket` por completo. El detalle de una venta ya registrada se
puede consultar después en `/ordenes` (FE-028), así que no hace falta
duplicar esa vista de detalle en `VentasView.vue`.

## Alcance

- `frontend/src/components/common/ConfirmModal.vue` (de FE-013): hoy tiene
  estilos por defecto de "acción destructiva" (`.btn-danger` rojo,
  `confirmText` por defecto "Eliminar"). Evaluar y decidir una de estas
  dos rutas (a criterio del implementador, documentar la decisión en
  Notas de implementación):
  - (a) agregar una variante visual opcional al componente (ej. prop
    `variant?: 'danger' | 'primary'`, default `'danger'` para no romper
    los usos existentes de Categorías/Productos/Inventario/FE-029) que
    cambie el botón de confirmar a un estilo neutro/positivo (ej.
    `.btn-primary`, gradiente morado ya usado en el resto del proyecto)
    en vez de rojo; o
  - (b) si se decide no tocar `ConfirmModal.vue`, justificar por qué pasar
    solo textos custom es suficiente y por qué no transmite "peligro" en
    este caso — pero dado que hoy el botón de confirmar es
    incondicionalmente `.btn-danger` (ver código de `ConfirmModal.vue`),
    la opción (a) es la esperada salvo que se encuentre una razón de peso
    para no hacerlo.
  - En cualquier caso: los usos existentes de `ConfirmModal` (Categorías,
    Productos, Inventario, `OrdenesView.vue`/FE-029 "Cancelar orden") deben
    seguir viéndose exactamente igual (rojo/danger) tras este cambio — no
    es aceptable una regresión visual en esas vistas.
- `frontend/src/views/VentasView.vue`:
  - Al pulsar "Confirmar venta" (`.btn-confirmar`), en vez de llamar
    directamente a `onConfirmarVenta()`/`POST /ventas`, abrir
    `ConfirmModal` (u otro modal de confirmación reutilizable) mostrando
    un resumen: cantidad de items del carrito, total (`carrito.total`),
    mesa seleccionada (nombre o "Venta libre"), y método de pago
    (Efectivo/Transferencia). **No** debe llamarse a `POST /ventas` hasta
    que el usuario confirme en el modal.
  - Al confirmar en el modal: ejecutar el `POST /ventas` (misma lógica que
    hoy tiene `onConfirmarVenta`, incluyendo el cálculo de payload) y,
    solo si tiene éxito:
    - Disparar un toast de éxito vía `useToast()` (FE-014), ej. "Venta
      confirmada exitosamente".
    - Limpiar el carrito (`resetVentaForm()` ya existente).
    - Si la venta tenía mesa asociada, refrescar `useMesas().load()` (igual
      que hoy).
    - Cerrar el modal de confirmación.
    - La vista queda mostrando el catálogo/carrito (ya vacío), lista para
      la siguiente venta — **no** se muestra ningún panel de ticket.
  - Si `POST /ventas` falla: el modal de confirmación permanece abierto o
    se cierra mostrando el error donde ya se maneja hoy (`saveError`,
    `role="alert"`) — a criterio del implementador, pero el error debe ser
    visible y no debe perderse silenciosamente; no debe limpiarse el
    carrito ni mostrarse el toast de éxito si la venta falló.
  - Cancelar el modal de confirmación (botón, overlay o `Escape`) no debe
    ejecutar ningún `POST /ventas` ni limpiar el carrito.
  - Eliminar por completo el panel `.ticket` (template, la interfaz
    `Ticket`, el estado `ticket`, y los handlers `onNuevaVenta`/
    `onVolverAMesas` si dejan de tener uso — revisar si "Volver a Mesas"
    sigue teniendo sentido en algún otro lugar de la vista; si no, se
    elimina junto con el ticket).
  - Mientras la venta está en curso (entre confirmar en el modal y que
    resuelva la promesa), preservar el estado de carga ya existente
    (`isSaving`, texto "Registrando…" en el botón de confirmar del modal).

## Criterios de aceptación

- [ ] Pulsar "Confirmar venta" con el carrito no vacío abre un modal de
      confirmación (no ejecuta `POST /ventas` de inmediato) mostrando
      cantidad de items, total, mesa (o "Venta libre") y método de pago.
- [ ] Cancelar el modal de confirmación (botón, overlay o `Escape`) no
      ejecuta ningún `POST /ventas` y no limpia el carrito.
- [ ] Confirmar en el modal ejecuta `POST /ventas` con el mismo payload
      que arma hoy `onConfirmarVenta` (items, metodo_pago, mesa_id).
- [ ] Tras una venta exitosa: aparece un toast de éxito (ej. "Venta
      confirmada exitosamente") con la estética de `ToastContainer.vue`
      (FE-014), el carrito queda vacío, y la vista muestra el catálogo
      (no aparece ningún panel `.ticket`).
- [ ] Si la venta tenía mesa asociada, tras confirmar exitosamente esa
      mesa aparece "Ocupada" al navegar a `/mesas` (mismo comportamiento
      que ya existía, verificable end-to-end).
- [ ] Si `POST /ventas` falla (ej. error de red o 4xx simulado), se
      muestra el error de forma visible, el carrito **no** se limpia, y
      no aparece el toast de éxito.
- [ ] El panel `.ticket` (template, interfaz `Ticket`, estado `ticket`) ya
      no existe en `VentasView.vue` — verificable por lectura de código
      (sin `v-if="ticket"` ni clase `.ticket` en el archivo).
- [ ] El botón de confirmar dentro del modal de venta **no** se ve con
      estética de "acción destructiva" (no es un botón rojo tipo
      eliminar) — verificable inspeccionando el color/estilo aplicado.
- [ ] Los usos existentes de `ConfirmModal` en Categorías, Productos,
      Inventario y `OrdenesView.vue` (cancelar orden, FE-029) siguen
      viéndose exactamente igual que antes (botón de confirmar rojo/
      danger) — sin regresión visual.
- [ ] `npx vue-tsc -b` y `npm run build` corren sin errores.

## Notas de implementación

- Decisión sobre `ConfirmModal.vue` (opción (a) del enunciado): se agregó una
  prop opcional `variant?: 'danger' | 'primary'` con default `'danger'`. El
  botón de confirmar ahora usa `class="btn-primary"` (mismo gradiente morado
  `linear-gradient(90deg, var(--color-purple), var(--color-purple-deep))`
  usado en el resto del proyecto) cuando `variant="primary"`, y mantiene
  `class="btn-danger"` (rojo) cuando `variant` es `'danger'` u omitido. Se
  verificó por lectura que ninguno de los usos existentes
  (`CategoriasView.vue`, `ProductosView.vue`, `InventarioView.vue`,
  `OrdenesView.vue` "Cancelar orden" de FE-029) pasa la prop `variant`, por lo
  que siguen usando el default `'danger'` sin cambio visual.
- `frontend/src/views/VentasView.vue`:
  - Se eliminó por completo el panel `.ticket`: la interfaz `Ticket`, el
    estado `ticket`, el template `<div v-if="ticket" class="ticket">…</div>`,
    los handlers `onNuevaVenta`/`onVolverAMesas` (este último dependía de
    `useRouter`, que también se eliminó del import al quedar sin uso) y todo
    el CSS scoped asociado (`.ticket`, `.ticket-meta`, `.ticket-lineas`,
    `.ticket-total`, `.ticket-actions`, y `.btn-secondary` que solo se usaba
    ahí).
  - "Confirmar venta" (`.btn-confirmar`) ahora llama a `onConfirmarVenta()`,
    que solo valida que el carrito no esté vacío y abre
    `showConfirmVenta = true` (ya NO llama `POST /ventas` directamente).
  - Se agregó `<ConfirmModal v-if="showConfirmVenta" variant="primary" …>`
    mostrando un resumen calculado en el computed `resumenConfirmacion`:
    cantidad de items (`cantidadItems`, suma de `linea.cantidad`), total
    (`formatCOP(carrito.total.value)`), mesa (`mesaSeleccionadaNombre` o
    "Venta libre") y método de pago (Efectivo/Transferencia), ej.:
    `"2 productos · Total $25.000 · Mesa 3 · Efectivo"`.
  - Al confirmar en el modal (`confirmarVentaDefinitiva`): ejecuta el mismo
    payload/lógica que antes tenía `onConfirmarVenta` (`POST /ventas` vía
    `crearVenta`). Si tiene éxito: dispara `pushToast('Venta confirmada
    exitosamente')` (tipo `'success'` por default de `useToast`), llama
    `resetVentaForm()` (limpia carrito/mesa/método de pago), refresca
    `useMesas().load()` solo si la venta tenía `mesa_id`, y cierra el modal
    (`showConfirmVenta = false`). La vista queda mostrando el catálogo con el
    carrito vacío, lista para la siguiente venta — no hay ningún panel de
    ticket.
  - Si `POST /ventas` falla: se decidió **cerrar** el modal de confirmación
    (en vez de dejarlo abierto) para que el mensaje de error existente
    (`saveError`, `<p class="error" role="alert">`, ya presente debajo del
    carrito) sea visible de inmediato sin quedar oculto detrás del overlay
    del modal; el carrito no se limpia ni se dispara el toast de éxito en
    este caso.
  - Cancelar el modal (botón "Volver", overlay o `Escape`, manejados por
    `BaseModal`/`ConfirmModal` sin cambios) solo ejecuta
    `cancelConfirmarVenta()`, que pone `showConfirmVenta = false` — no llama
    `POST /ventas` ni toca el carrito.
  - No se agregó ninguna librería nueva.
- Verificación: `npx vue-tsc -b` y `npm run build` corren sin errores. Se
  confirmó contra el dev server (`http://localhost:5173`) vía `curl` del
  módulo compilado de `VentasView.vue` que ya no queda ninguna referencia a
  `ticket`/`.ticket`, que se importa y usa `ConfirmModal` con
  `variant="primary"`, y del módulo `ConfirmModal.vue` que la prop `variant`
  efectivamente alterna entre `btn-primary`/`btn-danger`. También se
  verificó por lectura que los 4 usos existentes de `ConfirmModal` (Categorías,
  Productos, Inventario, Órdenes/FE-029) no pasan `variant`, preservando el
  rojo/danger.
  Prueba manual sugerida: ir a `/ventas`, agregar productos al carrito,
  pulsar "Confirmar venta" → debe abrir un modal morado (no rojo) con el
  resumen (items/total/mesa/método de pago); "Volver" o `Escape` cierra el
  modal sin registrar nada; confirmar registra la venta, muestra el toast
  verde "Venta confirmada exitosamente" y vuelve al catálogo con el carrito
  vacío; si la mesa estaba seleccionada, verificar en `/mesas` que aparece
  "Ocupada"; el detalle de la venta ya registrada se puede consultar en
  `/ordenes` (FE-028).

## Revisión

**Veredicto: `done`**

Revisado `ConfirmModal.vue` y `VentasView.vue` completos, y los 5 usos existentes de
`ConfirmModal` en el proyecto (`CategoriasView.vue`, `ProductosView.vue`,
`InventarioView.vue`, `OrdenesView.vue`, `VentasView.vue`). Corrido
`npx vue-tsc -b` y `npx vite build`: ambos sin errores.

- `ConfirmModal.vue`: prop `variant?: 'danger' | 'primary'` con default `'danger'`.
  El botón de confirmar usa `class="btn-primary"` (gradiente morado) solo si
  `variant === 'primary'`, si no `class="btn-danger"` (rojo). Verificado por
  grep que solo `VentasView.vue` pasa `variant="primary"`; los otros 4 usos
  (Categorías, Productos, Inventario, Órdenes/FE-029 cancelar) no pasan `variant`
  → siguen en rojo/danger, sin regresión visual.
- `VentasView.vue`: confirmado que no queda ninguna referencia a `ticket`/`Ticket`/
  `.ticket`/`onNuevaVenta`/`onVolverAMesas`/`useRouter` (grep sin resultados).
  `onConfirmarVenta()` ya no llama `POST /ventas` directamente, solo valida
  carrito no vacío y abre el modal (`showConfirmVenta = true`).
  `confirmarVentaDefinitiva()` ejecuta el mismo payload de antes
  (`items`/`metodo_pago`/`mesa_id`) vía `crearVenta`; en éxito dispara
  `pushToast('Venta confirmada exitosamente')` sin pasar `type` — confirmado en
  `useToast.ts` que el default de `push()` es `type: 'success'`. Limpia carrito
  (`resetVentaForm`), refresca mesas solo si `venta.mesa_id !== null`, cierra
  modal.
- Si `POST /ventas` falla: cierra el modal y no limpia carrito ni dispara toast de
  éxito (verificado en el bloque `catch`); el error queda visible en
  `saveError`/`role="alert"` bajo el carrito, decisión documentada y razonable.
- Cancelar el modal (`cancelConfirmarVenta`) solo cambia `showConfirmVenta` a
  `false`; verificado en `BaseModal.vue` que overlay-click y `Escape` emiten
  `close`, mapeado por `ConfirmModal` a `cancel` — no hay ruta que dispare
  `POST /ventas` al cancelar.
- El resumen del modal (`resumenConfirmacion`) muestra cantidad de items, total,
  mesa/"Venta libre" y método de pago, calculado antes de llamar a la API.

Sin hallazgos. Los 9 criterios de aceptación se cumplen.
