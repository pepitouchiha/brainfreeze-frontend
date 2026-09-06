---
id: FE-031
title: Iconos SVG (ojo/lápiz/cancelar) en botones de fila de la tabla de Órdenes
area: frontend
status: done
priority: medium
depends_on: [FE-018, FE-028, FE-029, FE-030]
created_by: planner
---

## Objetivo

El dueño del negocio notó, usando la app, que la pantalla "Órdenes"
(`frontend/src/views/OrdenesView.vue`, creada después de FE-018 por
FE-028/029/030) rompe el estándar visual de iconos que el proyecto ya
estableció en el resto de vistas CRUD (Productos/Inventario/Categorías):
sus botones de fila siguen siendo texto plano ("Ver detalle", "Editar",
"Cancelar", ver `<td class="orden-acciones">`, líneas ~288-309) en vez de
iconos SVG inline dibujados a mano, mismo patrón de
`frontend/src/components/layout/AppSidebar.vue` y de
`frontend/src/components/icons/IconPencil.vue`/`IconTrash.vue`
(`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`stroke-width="1.8"`, `stroke-linecap/linejoin="round"`, sin librerías de
terceros). Se pide corregir esta inconsistencia únicamente en los botones
de la fila de la tabla.

## Alcance

Botones a convertir, dentro de `<td class="orden-acciones">` de
`OrdenesView.vue` (líneas ~288-309):

- "Ver detalle" → icono de ojo. No existe un componente equivalente en
  `frontend/src/components/icons/` — crear
  `frontend/src/components/icons/IconEye.vue` nuevo, siguiendo exactamente
  el mismo patrón SVG que `IconPencil.vue`/`IconTrash.vue` (mismo
  `viewBox`/`stroke-width`/`fill="none"`, 16x16px, `aria-hidden="true"` +
  `focusable="false"` en el `<svg>`).
- "Editar" → reusar `frontend/src/components/icons/IconPencil.vue` ya
  existente, mismo color cian (`.btn-link`) y mismo criterio de FE-018 —
  no crear un icono nuevo para esto.
- "Cancelar" → **no** reusar `IconTrash.vue` (una cancelación de venta no
  es un borrado: la orden se conserva en la base de datos con
  `estado: "cancelada"`, ver BE-020). Crear un componente de icono nuevo
  apropiado para "cancelar/anular" (ej. una "X dentro de un círculo" o un
  símbolo tipo "ban"/prohibido), mismo patrón SVG que el resto, ubicado en
  `frontend/src/components/icons/` con un nombre descriptivo (ej.
  `IconBan.vue` o `IconCircleX.vue`, a criterio del implementador). Color
  rojo/danger (`.btn-link--danger`), igual que hoy.

Fuera de alcance (no tocar):

- Los botones "Editar orden"/"Cancelar orden"/"Cerrar" dentro del modal de
  detalle (`<div class="detalle-actions">`, líneas ~359-379) — son botones
  de acción primaria más grandes con texto (`.btn-secondary`/
  `.btn-danger-outline`), no iconos pequeños de fila; el pedido del usuario
  apunta al patrón icono-only de la tabla, no a estos. Quedan como texto,
  sin modificar.
- El botón "Guardar cambios"/"Cancelar" del formulario de edición
  (`<div class="form-actions">`) — es un formulario, no una fila de tabla,
  fuera de alcance.
- Ningún handler de Vue (`verDetalle`, `abrirEdicion`, `requestCancel`) — 
  solo el contenido visual del botón (markup interno + import de icono).
- No traer ninguna librería de iconos de terceros — igual restricción que
  FE-018.

## Criterios de aceptación

- [ ] El botón "Ver detalle" de cada fila de `OrdenesView.vue` muestra un
      icono de ojo (`IconEye.vue`, nuevo, mismo patrón SVG que
      `IconPencil.vue`) en vez del texto "Ver detalle".
- [ ] El botón "Editar" de cada fila muestra `IconPencil.vue` (reutilizado,
      no un componente nuevo) en vez del texto "Editar", solo visible para
      `orden.estado === 'activa'` (comportamiento de visibilidad existente
      intacto).
- [ ] El botón "Cancelar" de cada fila muestra un icono nuevo de
      cancelar/anular (NO `IconTrash.vue`, NO una basurita) en vez del
      texto "Cancelar", solo visible para `orden.estado === 'activa'`
      (comportamiento de visibilidad existente intacto).
- [ ] Los tres iconos siguen el mismo patrón visual que `AppSidebar.vue`/
      `IconPencil.vue`: `viewBox="0 0 24 24"`, `fill="none"`,
      `stroke="currentColor"`, trazos (no formas rellenas), tamaño
      consistente entre sí (16-18px) y alineados verticalmente con el
      resto de contenido de la fila.
- [ ] "Ver detalle" tiene `aria-label`/`title` = `"Ver detalle de la orden
      #<id>"` (dinámico por fila, con el id real de la orden).
- [ ] "Editar" tiene `aria-label`/`title` = `"Editar orden"`, y mientras
      `openingEditId === orden.id` el estado de carga (hoy texto
      "Cargando…") se preserva de forma accesible: `aria-label` cambia a
      algo equivalente (ej. `"Cargando orden…"`) y/o el botón expone
      `aria-busy="true"` (igual criterio que exigió FE-018).
- [ ] "Cancelar" tiene `aria-label`/`title` = `"Cancelar orden"`, y
      mientras `cancelingId === orden.id` el estado de carga (hoy texto
      "Cancelando…") se preserva igual de forma accesible (`aria-label`
      dinámico y/o `aria-busy="true"`).
- [ ] El color semántico existente se preserva: "Editar" en cian
      (`.btn-link`), "Cancelar" en rojo (`.btn-link--danger`), incluyendo
      los estados `:hover`/`:focus-visible`/`:disabled` ya definidos en
      `OrdenesView.vue` — no se pierden esos estados al cambiar de texto a
      icono.
- [ ] Los botones del modal de detalle (`.detalle-actions`) y del
      formulario de edición (`.form-actions`) **no** fueron modificados —
      siguen siendo texto plano, verificable por lectura de código.
- [ ] Ningún handler de Vue (`verDetalle`, `abrirEdicion`, `requestCancel`)
      fue modificado en su firma o lógica interna — solo el contenido
      visual del botón.
- [ ] No se agregó ninguna librería de iconos de terceros a
      `package.json`.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Componentes de icono nuevos creados en `frontend/src/components/icons/`:
  - `IconEye.vue`: ojo (arco + círculo central), mismo patrón SVG que
    `IconPencil.vue`/`IconTrash.vue` (`viewBox="0 0 24 24"`, `fill="none"`,
    `stroke="currentColor"`, `stroke-width="1.8"`, `stroke-linecap/linejoin="round"`,
    `aria-hidden="true"` + `focusable="false"`, 16x16px).
  - `IconBan.vue`: círculo con una diagonal (símbolo "prohibido"/"anular"),
    mismo patrón SVG. Se eligió deliberadamente NO reutilizar `IconTrash.vue`
    porque cancelar una orden no es un borrado (la orden se conserva en BD con
    `estado: "cancelada"`).
- `frontend/src/views/OrdenesView.vue`: en `<td class="orden-acciones">` los
  tres botones ahora son icon-only:
  - "Ver detalle" → `<IconEye />`, `aria-label`/`title` dinámico
    `` `Ver detalle de la orden #${orden.id}` ``.
  - "Editar" → `<IconPencil />` (reutilizado, sin crear componente nuevo),
    color cian (`.btn-link`) sin cambios; `aria-label`/`title` = "Editar orden"
    en reposo, "Cargando orden…" mientras `openingEditId === orden.id`
    (además de `aria-busy="true"` ya existente).
  - "Cancelar" → `<IconBan />`, color rojo (`.btn-link--danger`) sin cambios;
    `aria-label`/`title` = "Cancelar orden" en reposo, "Cancelando orden…"
    mientras `cancelingId === orden.id` (además de `aria-busy="true"` ya
    existente).
  - Ningún handler (`verDetalle`, `abrirEdicion`, `requestCancel`) fue tocado
    en su firma o lógica; solo el markup interno de los botones.
  - `.btn-link` (CSS scoped de `OrdenesView.vue`) ahora usa
    `display: inline-flex; align-items: center; justify-content: center;`
    (mismo criterio que `ProductosView.vue`) para centrar el icono y alinearlo
    verticalmente con el resto de la fila; los estados `:hover`/`:disabled`/
    `.btn-link--danger:hover` existentes no se modificaron.
  - `<div class="detalle-actions">` (modal de detalle) y
    `<div class="form-actions">` (formulario de edición) quedaron intactos,
    siguen con texto plano — fuera de alcance, verificado por lectura.
- No se agregó ninguna librería de iconos de terceros.
- Verificación: `npx vue-tsc -b` y `npm run build` corren sin errores; se
  confirmó contra el dev server (`http://localhost:5173`) que el HMR sirve
  `OrdenesView.vue` con los imports de `IconEye`/`IconBan`/`IconPencil` y los
  `aria-label`/`title` dinámicos esperados (`curl` del módulo compilado).
  Prueba manual sugerida: ir a `/ordenes`, verificar que cada fila con una
  orden activa muestra tres iconos (ojo/lápiz/prohibido) alineados a la
  derecha, con tooltip nativo al pasar el mouse y sin regresión de color
  (cian/rojo) ni de estados de carga.

## Revisión

**Veredicto: `done`**

Revisado `IconEye.vue`, `IconBan.vue` y `OrdenesView.vue`, y corrido
`npx vue-tsc -b` y `npx vite build` (ambos sin errores, incluye este cambio y FE-032
en el mismo build).

- `IconEye.vue`/`IconBan.vue` siguen exactamente el patrón de `IconPencil.vue`:
  `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`,
  `stroke-linecap/linejoin="round"`, `aria-hidden="true"` + `focusable="false"`,
  16x16px. `IconBan.vue` es un círculo con diagonal (no reutiliza `IconTrash.vue`),
  correcto conforme al alcance.
- Los tres botones de fila (`orden-acciones`) preservan `aria-label`/`title`
  dinámicos: "Ver detalle de la orden #<id>", "Editar orden"/"Cargando orden…" con
  `aria-busy` ligado a `openingEditId === orden.id`, "Cancelar orden"/"Cancelando
  orden…" con `aria-busy` ligado a `cancelingId === orden.id`. Visibilidad
  condicionada a `orden.estado === 'activa'` intacta.
- `verDetalle`, `abrirEdicion`, `requestCancel` no fueron tocados en firma/lógica
  (verificado por lectura completa del `<script setup>`).
- `.detalle-actions` (modal de detalle) y `.form-actions` (formulario de edición)
  siguen con texto plano, sin modificar.
- No se agregó librería de iconos de terceros.
- Color semántico preservado: `.btn-link` cian, `.btn-link--danger` rojo,
  `:hover`/`:disabled` intactos.

Hallazgo menor, no bloqueante (no es responsabilidad de esta tarea): `.btn-link` en
`OrdenesView.vue` no tiene `:focus-visible` definido, a diferencia de
`ProductosView.vue` (que sí tiene `.btn-link:focus-visible` desde FE-018). Esto ya
existía antes de FE-031 (no fue introducido por este cambio, que solo tocó el
contenido interno de los botones) — lo dejo anotado por si el planner quiere
homogeneizar accesibilidad de teclado entre vistas en una tarea aparte.
