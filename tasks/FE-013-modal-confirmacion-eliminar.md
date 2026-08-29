---
id: FE-013
title: Modal de confirmación antes de eliminar (Categorías, Productos, Inventario)
area: frontend
status: done
priority: high
depends_on: []
created_by: planner
---

## Objetivo

Hoy, en las vistas con acción "Eliminar", el botón llama directamente a
`remove()` sin ningún diálogo previo — verificado por lectura de código:
`onDelete()` en `CategoriasView.vue` (línea 64), `ProductosView.vue` (línea
125) e `InventarioView.vue` (línea 97) invocan `remove(id)` de inmediato al
hacer click. Se pide agregar un popup de confirmación antes de ejecutar la
eliminación, para evitar borrados accidentales.

Nota de alcance importante: el pedido original mencionaba "4 vistas CRUD
(Categorías, Productos, Inventario, Mesas)", pero verificado por grep
(`onDelete|remove\(`) `MesasView.vue` **no tiene** una acción de eliminar
mesa — solo tiene "Marcar libre" (`onLiberar`) y creación. Por lo tanto esta
tarea aplica a las 3 vistas que sí tienen "Eliminar": Categorías, Productos
e Inventario. Si en el futuro se agrega eliminar mesa, debería reutilizar el
mismo componente de confirmación.

## Alcance

- Nuevo componente de confirmación construido sobre
  `frontend/src/components/common/BaseModal.vue` (que ya expone slot por
  defecto, cierre por click en overlay y `Escape` emitiendo `close`). Puede
  ser un componente `ConfirmModal.vue` que envuelve `BaseModal` y agrega
  props para título/mensaje/texto de botones y emite `confirm`/`cancel`, o
  un patrón más simple — decisión del frontend-dev, pero debe quedar como
  un componente reutilizable en `frontend/src/components/common/`, no
  duplicado 3 veces.
- En `CategoriasView.vue`, `ProductosView.vue` e `InventarioView.vue`: el
  click en "Eliminar" ya no debe llamar a `onDelete()`/`remove()`
  directamente — primero debe abrir el modal de confirmación mostrando qué
  entidad se va a eliminar (ej. el nombre de la categoría/producto/insumo).
  Solo si el usuario confirma, se ejecuta el `remove()` existente (la
  lógica interna de `onDelete` — manejo de `deletingId`, `deleteErrorFor`,
  `messageFor` — no cambia, solo el punto en el que se dispara).
- Cancelar (botón "Cancelar" del modal, click en el overlay, o `Escape`) no
  debe ejecutar ninguna llamada al API.
- No incluye: sistema de notificaciones de éxito/error tras eliminar (eso
  es FE-014), ni cambios visuales a los botones "Eliminar" en sí (eso es
  FE-015 — esta tarea solo cablea el comportamiento de confirmación).
- No incluye agregar una acción de eliminar a `MesasView.vue` (fuera de
  alcance, ver nota arriba).

## Criterios de aceptación

- [ ] Existe un componente de confirmación reutilizable en
      `frontend/src/components/common/` construido sobre `BaseModal.vue`,
      usado por las 3 vistas (Categorías, Productos, Inventario) — no hay
      3 implementaciones duplicadas del diálogo de confirmación.
- [ ] En las 3 vistas, al pulsar "Eliminar" sobre una fila/tarjeta, aparece
      el modal de confirmación mostrando el nombre de la entidad a eliminar
      antes de llamar al API — verificado que no se ejecuta ningún
      `DELETE` hasta confirmar.
- [ ] Confirmar en el modal ejecuta la eliminación con el mismo
      comportamiento actual (estado `deletingId`/texto "Eliminando…",
      manejo de error inline vía `deleteErrorFor`/`messageFor` si el
      backend responde 409/error).
- [ ] Cancelar (botón "Cancelar", click fuera del modal sobre el overlay, o
      `Escape`) cierra el modal sin ejecutar ningún `DELETE`.
- [ ] `MesasView.vue` no fue modificado por esta tarea.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Nuevo `frontend/src/components/common/ConfirmModal.vue`: envuelve
  `BaseModal` y agrega props `title`, `message`, `confirmText` (default
  "Eliminar"), `confirmingText` (default "Eliminando…"), `cancelText`
  (default "Cancelar") e `isConfirming`. Emite `confirm`/`cancel` — `cancel`
  se dispara tanto al pulsar el botón "Cancelar" propio del componente como
  al recibir `close` de `BaseModal` (overlay/`Escape`), así el padre solo
  necesita un handler de cierre. Estilo propio (botones `.btn-secondary`/
  `.btn-danger` scoped al componente) consistente con `tokens.css`
  (`--color-danger`, `--radius-md`) — no reutiliza las clases `.btn-*` de
  las vistas porque son estilos scoped locales a cada archivo, no un design
  system compartido; se mantiene el mismo look visual pero con su propia
  definición para que el componente sea autocontenido.
- En `CategoriasView.vue`, `ProductosView.vue` e `InventarioView.vue`: el
  botón "Eliminar" ahora llama a `requestDelete(entidad)` (antes llamaba a
  `onDelete`/`remove` directo), que solo asigna `pendingDelete.value`. El
  `<ConfirmModal v-if="pendingDelete">` muestra el nombre de la
  entidad (`«${pendingDelete.nombre}»`) y llama a `confirmDelete()` en
  `@confirm` (ejecuta el `remove()` existente, con el mismo manejo de
  `deletingId`/`deleteErrorFor`/`messageFor` de antes — solo se movió el
  punto donde se dispara) y a `cancelDelete()` en `@cancel` (solo limpia
  `pendingDelete`, sin llamar al API). En caso de error del backend
  (ej. 409), el modal se cierra igualmente (`pendingDelete.value = null`
  también en el `catch`) y el error queda visible como antes vía
  `deleteErrorFor[id]` en la fila/tarjeta correspondiente — se decidió así
  en vez de mantener el modal abierto con el error dentro, porque
  `ConfirmModal` no tiene slot para mensajes de error y el patrón inline
  existente (`role="alert"` bajo la fila) ya cubre ese caso sin duplicar
  UI.
- `MesasView.vue` no fue tocado (no tiene acción de eliminar, confirmado
  por grep — solo `onLiberar`/creación, fuera de alcance según la nota del
  planner en el objetivo).
- Archivos tocados: `frontend/src/components/common/ConfirmModal.vue`
  (nuevo), `frontend/src/views/CategoriasView.vue`,
  `frontend/src/views/ProductosView.vue`,
  `frontend/src/views/InventarioView.vue`.
- Cómo probarlo: `npm run dev`, iniciar sesión, y en Categorías/Productos/
  Inventario pulsar "Eliminar" sobre una fila/tarjeta — debe aparecer el
  modal de confirmación con el nombre de la entidad, sin haber llamado
  todavía al API. Verificar que "Cancelar", click en el overlay o `Escape`
  cierran el modal sin eliminar nada (la fila sigue presente). Confirmar
  debe ejecutar la eliminación (texto "Eliminando…" mientras está en
  curso) y, si el backend responde error (ej. 409 por referencias
  existentes), el modal se cierra y el mensaje de error aparece inline
  bajo la fila, igual que antes de esta tarea.
- `npx vue-tsc -b` y `npm run build` corren sin errores.

## Revisión

**Veredicto: done**

Verificado por lectura de código:

- `frontend/src/components/common/ConfirmModal.vue` envuelve `BaseModal`
  (que ya maneja overlay/`Escape` → `close`), expone `title`/`message`/
  `confirmText`/`confirmingText`/`cancelText`/`isConfirming`, y emite
  `confirm`/`cancel` (`cancel` también se dispara desde `@close` de
  `BaseModal`, cerrando la brecha overlay/Escape). Es un único componente
  reutilizable, no hay 3 copias.
- `CategoriasView.vue`, `ProductosView.vue`, `InventarioView.vue`: el botón
  "Eliminar" llama a `requestDelete(entidad)` (solo asigna
  `pendingDelete`), y `<ConfirmModal v-if="pendingDelete">` dispara
  `confirmDelete()`/`cancelDelete()`. `confirmDelete()` reutiliza
  exactamente el mismo flujo de `deletingId`/`remove()`/`deleteErrorFor`
  que existía antes, solo movido detrás de la confirmación — no hay ningún
  `DELETE` disparado hasta pulsar "Confirmar" en el modal.
- `MesasView.vue` confirmado sin modificar por esta tarea (grep de
  `onDelete|remove\(` no arroja coincidencias — no tiene acción de
  eliminar).
- `npx vue-tsc -b` y `npx vite build` corren sin errores (verificado de
  nuevo en esta revisión sobre el estado final del árbol, incluyendo los
  cambios posteriores de FE-014/015/017 sobre los mismos archivos).

Sin hallazgos. Cumple los 6 criterios de aceptación.
