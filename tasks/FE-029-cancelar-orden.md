---
id: FE-029
title: Cancelar una orden desde la pantalla de Órdenes
area: frontend
status: done
priority: high
depends_on: [FE-028, BE-020]
created_by: planner
---

## Objetivo

Sobre la pantalla "Órdenes" de FE-028 (solo lectura), agregar la acción de
cancelar una orden activa, consumiendo `POST /ventas/{id}/cancelar` de
BE-020, con confirmación previa (reutilizando el patrón ya establecido en
el proyecto, FE-013) y feedback de éxito/error (FE-014), en vez de
inventar un patrón de confirmación/notificación nuevo.

## Alcance

- `frontend/src/api/ventas.ts`: nueva función `cancelarVenta(id: number):
  Promise<Venta>` → `POST /ventas/${id}/cancelar`.
- `frontend/src/composables/useVentas.ts`: exponer un método `cancel(id:
  number): Promise<Venta>` delgado sobre `cancelarVenta`, siguiendo el
  mismo patrón que `create`.
- `frontend/src/views/OrdenesView.vue` (de FE-028):
  - Botón "Cancelar" por fila/detalle, visible/habilitado **solo** cuando
    `orden.estado === 'activa'` (oculto o deshabilitado para órdenes ya
    canceladas — decisión del implementador cuál de las dos, pero debe ser
    imposible iniciar el flujo de cancelación sobre una ya cancelada desde
    la UI).
  - Al pulsar "Cancelar": abrir el componente reutilizable de confirmación
    ya existente (`frontend/src/components/common/ConfirmModal.vue` de
    FE-013), mostrando un mensaje claro con el id/total de la orden a
    cancelar. **No** llamar a la API hasta que el usuario confirme.
  - Al confirmar: llamar a `cancel(id)`, mostrar estado de "Cancelando…"
    mientras está en curso (mismo patrón `deletingId`/texto en progreso ya
    usado para eliminar en otras vistas), y al resolver:
    - Éxito: disparar un toast de éxito vía `useToast()` (FE-014, ej.
      "Orden cancelada"), refrescar el listado de órdenes (para que el
      estado/badge se actualice sin recargar la página), y si la orden
      cancelada tenía mesa asociada, refrescar también `useMesas().load()`
      para que quede reflejada como libre si el usuario navega a Mesas.
    - Error (ej. `409` porque alguien más ya la canceló, o error de red):
      mostrar el mensaje vía el mecanismo de error ya usado en el proyecto
      (inline bajo la fila, o un toast de error — a criterio del
      implementador, consistente con cómo FE-013/FE-014 resolvieron este
      mismo caso para eliminar), sin dejar la UI en un estado inconsistente
      (ej. sin quitar la orden de la lista si la cancelación falló).
  - Cancelar el modal de confirmación (botón "Cancelar" del propio modal,
    click en overlay, o `Escape`) no debe ejecutar ninguna llamada al API.

## Criterios de aceptación

- [ ] El botón de cancelar una orden solo está disponible/habilitado para
      órdenes con `estado === 'activa'`.
- [ ] Pulsar "Cancelar" abre `ConfirmModal` (reutilizado, no una
      implementación nueva) mostrando información identificable de la
      orden (al menos su id o total), sin haber llamado todavía a
      `POST /ventas/{id}/cancelar`.
- [ ] Cancelar el modal de confirmación (botón, overlay o `Escape`) no
      ejecuta ningún `POST /ventas/{id}/cancelar`.
- [ ] Confirmar ejecuta la cancelación; mientras está en curso se muestra
      un estado de carga distinguible (ej. "Cancelando…").
- [ ] Tras una cancelación exitosa: aparece un toast de éxito, la orden se
      refleja como "Cancelada" en el listado sin recargar la página
      completa, y si la orden tenía mesa asociada, `useMesas()` se
      refresca (verificable navegando a Mesas después y viendo la mesa
      libre, o inspeccionando que se llamó `loadMesas()`/equivalente).
- [ ] Si el backend responde error (ej. `409` porque ya estaba cancelada),
      la UI muestra el error sin dejar la orden marcada como cancelada de
      forma optimista incorrecta.
- [ ] `npx vue-tsc -b` y `npm run build` corren sin errores.

## Notas de implementación

Implementado tal como está descrito en la tarea, sin desviaciones.

**Archivos tocados:**

- `frontend/src/api/ventas.ts`: nueva `cancelarVenta(id): Promise<Venta>` →
  `POST /ventas/${id}/cancelar` (sin body, igual que el contrato real del
  backend).
- `frontend/src/composables/useVentas.ts`: nuevo `cancel(id)` delgado sobre
  `cancelarVenta`, mismo patrón que `create`.
- `frontend/src/views/OrdenesView.vue`: botón "Cancelar" por fila (solo
  visible si `orden.estado === 'activa'`, deshabilitado + texto "Cancelando…"
  mientras `cancelingId === orden.id`) y un botón equivalente dentro del
  modal de detalle. Al pulsar, se abre `ConfirmModal` (reutilizado de
  FE-013, sin implementación nueva) con el id y el total de la orden; la API
  solo se llama al confirmar. Estado `pendingCancel`/`cancelingId`/
  `cancelErrorFor` (por id, mismo patrón que `deletingId`/`deleteErrorFor` de
  `CategoriasView.vue`). Al confirmar: `cancel(id)` → si tiene éxito, toast
  "Orden cancelada" (`useToast`), se cierra el modal de detalle si estaba
  abierto sobre esa orden, se refresca el listado (`refrescarOrdenes()`,
  conservando los filtros activos) y, solo si `orden.mesa_id !== null`, se
  refresca `useMesas().load()`. Si falla (ej. `409`), el mensaje de error se
  muestra en una fila inline bajo la orden (`role="alert"`) y en el modal de
  detalle si estaba abierto; la orden no se marca como cancelada de forma
  optimista (el estado mostrado siempre viene del último `GET`/`POST`
  exitoso, nunca se muta localmente antes de confirmar la respuesta).
  Cancelar el modal (botón "Volver", overlay o `Escape`, vía `BaseModal`) no
  ejecuta ninguna llamada.

**Cómo se probó:** sobre el mismo backend real (`uvicorn` + SQLite temporal
del scratchpad) usado en FE-028. Con `curl` replicando exactamente el
`POST /ventas/{id}/cancelar` sin body que arma la UI: cancelar una venta
activa con mesa asociada devuelve `200` con `estado: "cancelada"` y
`GET /mesas` inmediatamente después confirma la mesa `libre`; cancelar la
misma venta de nuevo devuelve `409` con
`{"detail":"La venta ya está cancelada"}` (mensaje que `messageFor`/
`ApiError` propagan tal cual a la UI). `npx vue-tsc -b` y `npm run build`
corren sin errores.

## Revisión

**Veredicto: `done`.**

Revisé `api/ventas.ts` (`cancelarVenta`), `composables/useVentas.ts`
(`cancel`), `views/OrdenesView.vue` (flujo completo de cancelación) y
`components/common/ConfirmModal.vue`/`BaseModal.vue`:

- Botón "Cancelar" solo se renderiza con `v-if="orden.estado === 'activa'"`
  (fila y modal de detalle) — imposible iniciar el flujo sobre una ya
  cancelada desde la UI (`OrdenesView.vue:300-309,370-377`).
- `requestCancel` solo asigna `pendingCancel`, no llama a la API; el
  `ConfirmModal` (reutilizado de FE-013, sin implementación nueva) muestra
  id y total de la orden en el mensaje. Confirmé leyendo
  `ConfirmModal.vue` que cerrar por overlay/`Escape` emite `cancel` (vía
  `BaseModal`), y `cancelCancelacion()` solo limpia el estado local — cero
  llamadas a `POST /ventas/{id}/cancelar` en ese camino.
  `confirmCancelacion()` es la única función que invoca `cancelarOrden`.
- Estado de carga `cancelingId`/texto "Cancelando…" mientras está en curso,
  deshabilita el botón durante la operación.
- Verificado con curl replicando exactamente el `POST` sin body que arma
  la UI: cancelar una venta activa con mesa -> `200` + `GET /mesas`
  confirma `libre`; cancelar de nuevo -> `409`
  (`{"detail":"La venta ya está cancelada"}`), mensaje que `messageFor`
  propaga tal cual a `cancelErrorFor[id]` sin marcar la orden como
  cancelada de forma optimista (el estado mostrado siempre viene del
  último `GET`/`POST` exitoso vía `refrescarOrdenes()`).
- Éxito: toast "Orden cancelada" (`useToast`), `refrescarOrdenes()` (con
  filtros conservados) y `loadMesas()` solo si `orden.mesa_id !== null` —
  coincide con el criterio de refrescar mesas condicionalmente.
- `npx vue-tsc -b` y `npm run build` sin errores (verificado).

No se encontraron hallazgos bloqueantes.
