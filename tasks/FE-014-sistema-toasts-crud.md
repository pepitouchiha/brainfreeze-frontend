---
id: FE-014
title: Sistema de notificaciones toast para operaciones CRUD (crear/editar/eliminar)
area: frontend
status: done
priority: medium
depends_on: []
created_by: planner
---

## Objetivo

Hoy no existe ningún sistema de notificación de éxito en la app — verificado
que `frontend/src/components/` no tiene ningún componente tipo toast/banner,
y que tras crear, editar o eliminar una categoría/producto/insumo/mesa no
hay ningún feedback visual de que la operación se completó (solo se cierra
el modal o se refresca la lista, sin confirmación explícita). Los mensajes
de error inline (`role="alert"`) sí existen y deben seguir funcionando tal
cual — esta tarea no los reemplaza, agrega feedback de **éxito**.

El proyecto no usa ninguna librería de UI externa (`frontend/package.json`
solo tiene `vue` y `vue-router` como dependencies) — el sistema de toasts
debe construirse sin agregar dependencias nuevas.

## Alcance

- Nuevo composable/store simple, ej. `frontend/src/composables/useToast.ts`,
  con un estado reactivo compartido (módulo con un `reactive`/`ref` a nivel
  de módulo, sin Pinia — no hace falta introducir una librería de estado
  para esto) y una función `push(message: string, type?: 'success' | 'error')`
  que agrega un toast con un id único, y se auto-remueve después de un
  tiempo (sugerido 3-4s).
- Nuevo componente `frontend/src/components/common/ToastContainer.vue` que
  lee el estado del composable, se monta **una sola vez** en `App.vue` (no
  por vista), usa `<Teleport to="body">` para apilarse sobre el resto del
  contenido (posición fija, ej. `top: 20px; right: 20px`), y permite cerrar
  cada toast manualmente con un botón "×" además del auto-dismiss.
- Integración: tras un `create`/`update` exitoso en `CategoriasView.vue`,
  `ProductosView.vue`, `InventarioView.vue` y `MesasView.vue` (creación de
  mesa), disparar un toast de éxito con mensaje específico (ej. "Categoría
  creada", "Producto actualizado", "Insumo creado", "Mesa creada"). Tras una
  eliminación exitosa en Categorías/Productos/Inventario (ver FE-013 — la
  eliminación ahora pasa por un modal de confirmación, pero el punto donde
  se dispara el toast es el mismo: cuando `remove()` resuelve sin error),
  disparar un toast de éxito (ej. "Categoría eliminada"). Tras "Marcar
  libre" exitoso en `MesasView.vue` (`onLiberar`), disparar también un toast
  de éxito.
- Explícitamente fuera de alcance: no duplicar los errores existentes como
  toasts — los mensajes de error inline (`formError`, `deleteErrorFor`,
  `liberarErrorFor`, todos con `role="alert"`) siguen siendo el mecanismo
  principal de feedback de error y no se tocan en esta tarea, para evitar
  mostrar el mismo error dos veces (inline + toast). Si el frontend-dev
  considera valioso también emitir un toast de error, debe hacerlo sin
  quitar el mensaje inline existente, pero no es un requisito de esta
  tarea.
- No incluye tocar `VentasView.vue` (registrar una venta ya tiene su propio
  flujo de confirmación visual — el ticket que se muestra tras confirmar).

## Criterios de aceptación

- [ ] Existe `frontend/src/composables/useToast.ts` (o ubicación equivalente)
      exponiendo una API para agregar toasts, sin agregar ninguna dependencia
      nueva a `package.json`.
- [ ] Existe `frontend/src/components/common/ToastContainer.vue`, montado
      una única vez en `App.vue`, no repetido en cada vista.
- [ ] Crear o editar una categoría, producto, insumo o mesa exitosamente
      dispara un toast de éxito con un mensaje claro y específico a la
      entidad/acción (no un mensaje genérico único para todo).
- [ ] Eliminar exitosamente una categoría, producto o insumo (tras confirmar
      en el modal de FE-013) dispara un toast de éxito.
- [ ] Marcar una mesa como libre exitosamente dispara un toast de éxito.
- [ ] Los toasts se auto-descartan después de unos segundos y también se
      pueden cerrar manualmente.
- [ ] Disparar dos o más toasts en sucesión rápida los apila visiblemente
      (no se pisan ni se pierde ninguno).
- [ ] Los mensajes de error inline existentes (`role="alert"`) siguen
      funcionando exactamente igual que antes de esta tarea.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Nuevo `frontend/src/composables/useToast.ts`: estado compartido a nivel
  de módulo con un array `reactive<Toast[]>` (sin Pinia, sin dependencias
  nuevas). `push(message, type = 'success')` agrega un toast con
  `id` incremental (`nextId++`, no `crypto.randomUUID` porque no hace
  falta unicidad global, solo dentro de la sesión de la pestaña) y
  programa su propio `dismiss(id)` vía `setTimeout` a los 3.5s
  (`DURATION_MS`). `dismiss(id)` también se expone para el cierre manual.
  `useToast()` devuelve `{ toasts, push, dismiss }` — al ser un `reactive`
  de módulo (no un `ref` re-creado por llamada), todas las vistas y el
  `ToastContainer` comparten la misma instancia.
- Nuevo `frontend/src/components/common/ToastContainer.vue`: lee
  `toasts`/`dismiss` de `useToast`, usa `<Teleport to="body">` y
  `position: fixed; top: 20px; right: 20px` para apilarse sobre el resto
  del contenido (`z-index: 200`, por encima del overlay de `BaseModal`
  que usa `z-index: 100`, así un toast puede verse incluso si hay un modal
  abierto detrás). Cada toast tiene `role="status"` (no `alert`, para no
  interferir con los `role="alert"` de error existentes en el árbol de
  accesibilidad) y un botón "×" con `aria-label="Cerrar notificación"`
  para cierre manual. Se usa `<TransitionGroup>` con una animación de
  entrada/salida sutil (fade + translate, 200ms) — motion mínimo y con
  propósito, consistente con el resto del pulido de esta pasada. Variante
  `.toast--error` (borde izquierdo `--color-danger`) queda implementada en
  el componente para uso futuro, aunque las integraciones actuales solo
  disparan `type: 'success'` (ver alcance: no se duplican los errores
  inline como toasts, tal como pide la tarea).
- Montado una única vez en `frontend/src/App.vue` (antes solo
  `<RouterView />`; ahora `<RouterView /><ToastContainer />` como
  hermanos, fuera de cualquier vista).
- Integración por vista (todas vía `const { push: pushToast } =
  useToast()`):
  - `CategoriasView.vue`: "Categoría creada"/"Categoría actualizada" tras
    `create`/`update` exitoso en `onSubmit`; "Categoría eliminada" tras
    `remove()` exitoso en `confirmDelete()` (el punto que introdujo
    FE-013).
  - `ProductosView.vue`: "Producto creado"/"Producto actualizado";
    "Producto eliminado" tras `remove()` exitoso en `confirmDelete()`.
  - `InventarioView.vue`: "Insumo creado"/"Insumo actualizado"; "Insumo
    eliminado" tras `remove()` exitoso en `confirmDelete()`. No se agregó
    toast para "Ajustar stock" (`onAjustar`) — no estaba en el alcance de
    la tarea (que solo pide crear/editar/eliminar de categoría/producto/
    insumo/mesa y "Marcar libre" de mesa).
  - `MesasView.vue`: "Mesa creada" tras `create()` exitoso en `onSubmit`
    (Mesas no tiene "editar", solo alta); "Mesa liberada" tras `liberar()`
    exitoso en `onLiberar`.
  - En los 4 casos, los mensajes de error inline existentes
    (`formError`, `deleteErrorFor`, `liberarErrorFor`, todos con
    `role="alert"`) no fueron tocados — siguen siendo el único mecanismo
    de feedback de error, sin duplicado como toast.
- Toasts en sucesión rápida se apilan verticalmente (cada uno es un
  elemento independiente en el array `toasts`, con su propio `setTimeout`
  de auto-dismiss) sin pisarse, gracias al `flex-direction: column; gap:
  10px` del contenedor y las keys únicas (`toast.id`) en
  `<TransitionGroup>`.
- Archivos tocados: `frontend/src/composables/useToast.ts` (nuevo),
  `frontend/src/components/common/ToastContainer.vue` (nuevo),
  `frontend/src/App.vue`, `frontend/src/views/CategoriasView.vue`,
  `frontend/src/views/ProductosView.vue`,
  `frontend/src/views/InventarioView.vue`, `frontend/src/views/MesasView.vue`.
  `VentasView.vue` no fue tocado (fuera de alcance, tiene su propio flujo
  de confirmación con el ticket).
- Cómo probarlo: `npm run dev`, iniciar sesión, y en Categorías/Productos/
  Inventario crear o editar una entidad — debe aparecer un toast en la
  esquina superior derecha con el mensaje específico (ej. "Categoría
  creada"), que se autodescarta a los ~3.5s o se puede cerrar con "×".
  Eliminar una entidad (confirmando en el modal de FE-013) debe disparar
  también su toast correspondiente. En Mesas, crear una mesa y pulsar
  "Marcar libre" sobre una mesa ocupada deben disparar "Mesa creada"/"Mesa
  liberada" respectivamente. Disparar varias acciones seguidas (ej. crear
  dos categorías rápido) debe apilar los toasts sin que se pisen. Los
  mensajes de error inline (ej. nombre vacío, 409 por nombre duplicado)
  siguen mostrándose igual que antes, sin un toast de error acompañándolos.
- `npx vue-tsc -b` y `npm run build` corren sin errores.

## Revisión

**Veredicto: done**

Verificado por lectura de código:

- `frontend/src/composables/useToast.ts`: estado compartido a nivel de
  módulo (`reactive<Toast[]>`), sin dependencias nuevas (`package.json` no
  fue tocado). `push(message, type='success')` con id incremental y
  auto-dismiss a los 3.5s vía `setTimeout`; `dismiss(id)` expuesto para
  cierre manual.
- `frontend/src/components/common/ToastContainer.vue`: montado una única
  vez en `App.vue` (`<RouterView /><ToastContainer />`), usa
  `<Teleport to="body">`, `position: fixed; top:20px; right:20px`,
  `role="status"` (no pisa los `role="alert"` existentes),
  `aria-label="Cerrar notificación"` en el botón "×", y
  `<TransitionGroup>` para apilar sin pisarse.
- Integración confirmada en `CategoriasView.vue`, `ProductosView.vue`,
  `InventarioView.vue` (crear/editar/eliminar, mensajes específicos por
  entidad y acción) y `MesasView.vue` (crear mesa, marcar libre). Los
  mensajes de error inline (`formError`, `deleteErrorFor`,
  `liberarErrorFor`, `role="alert"`) no fueron tocados.
- `VentasView.vue` no fue modificado, tal como pedía el alcance.
- `npx vue-tsc -b` y `npx vite build` corren sin errores.

Sin hallazgos. Cumple los 8 criterios de aceptación.
