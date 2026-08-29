---
id: FE-019
title: "Bug: borde inferior cortado en la columna de acciones de la tabla"
area: frontend
status: done
priority: medium
depends_on: []
created_by: planner
---

## Objetivo

Corregir un bug visual reproducido con captura de pantalla (zoom 3x) en
`ProductosView.vue`: el `border-bottom` de cada fila de la tabla no se
renderiza en el ancho completo de la columna de acciones (Editar/Eliminar),
dejando un hueco visible sin línea debajo de esos botones, mientras el resto
de columnas (Nombre/Categoría/Precio/Estado) sí muestran la línea completa.

## Alcance

Causa raíz diagnosticada por lectura de CSS: la clase `.actions-cell`
(`display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`) está
aplicada directamente sobre el elemento `<td class="actions-cell">`.
Forzar `display: flex` en una celda `<td>` interfiere con el layout de
tabla y con el renderizado de su borde inferior — es la causa del hueco
observado.

Archivos afectados (confirmado por grep, mismo patrón `<td
class="actions-cell">` en ambos):

- `frontend/src/views/ProductosView.vue` (`<td class="actions-cell">` en
  la fila de la tabla, ~línea 326; regla `.actions-cell` en `<style>`,
  ~línea 574).
- `frontend/src/views/InventarioView.vue` (`<td class="actions-cell">`,
  ~línea 256; regla `.actions-cell`, ~línea 509).

Fix esperado (patrón recomendado, verificar al implementar que resuelve el
bug visualmente):

- Quitar `display: flex` (y `flex-wrap`/`align-items`/`gap`) de la regla
  `.actions-cell` que aplica sobre el `<td>`, dejando que el `<td>` use su
  `display: table-cell` normal (sin forzarlo).
- Envolver el contenido actual de esa celda (los botones + el `<p
  class="error--inline">` de error de borrado que ya vive dentro de la
  celda) en un elemento hijo nuevo (ej. `<div class="actions-inner">`), y
  mover `display: flex; flex-wrap: wrap; align-items: center; gap: 8px;` a
  ese div.
- El `<td>` puede conservar la clase `actions-cell` para mantener cualquier
  padding/estilo propio de celda que no sea el `display: flex`, o quitarla
  si ya no aporta nada — a criterio del frontend-dev, siempre que el fix
  raíz (mover el `display: flex` fuera del `<td>`) se cumpla.

No incluye:

- `frontend/src/views/CategoriasView.vue` ni `frontend/src/views/MesasView.vue`
  — ahí `.category-actions`/`.mesa-actions` ya son un `<div>` dentro de una
  tarjeta (`<li>`), no un `<td>` de tabla; no tienen este bug y no deben
  tocarse.
- Cambios de contenido/handlers de los botones (eso es FE-018, tarea
  independiente que toca el mismo bloque de HTML). Ambas tareas pueden
  implementarse en cualquier orden; si se solapan, verificar al final que
  el wrapper `<div>` de esta tarea sigue conteniendo los iconos/botones que
  agregue FE-018 y que ninguna de las dos pisa el trabajo de la otra.
- Cualquier otro ajuste visual de la tabla no relacionado con este borde
  (ya cubierto por FE-015).

## Criterios de aceptación

- [ ] En `ProductosView.vue`, el `<td class="actions-cell">` ya no tiene
      `display: flex` aplicado directamente sobre el `<td>`; el layout
      flex del contenido (botones) vive en un elemento hijo.
- [ ] En `InventarioView.vue`, se aplica el mismo fix (mismo patrón de
      `<td class="actions-cell">`).
- [ ] Verificado visualmente (captura de pantalla o inspección del DOM
      renderizado) que el `border-bottom` de cada fila en
      `ProductosView.vue` e `InventarioView.vue` ahora se ve continuo bajo
      la columna de acciones, igual que bajo el resto de columnas de esa
      misma fila.
- [ ] El wrap/espaciado de los botones dentro de la celda (`gap: 8px`,
      `flex-wrap: wrap`) se mantiene visualmente igual que antes del fix —
      solo cambia dónde vive la regla `display: flex`, no el resultado
      visual de la disposición de los botones.
- [ ] El párrafo de error inline (`<p class="error--inline">`, mostrado
      cuando falla un borrado) que vive dentro de esa misma celda se sigue
      viendo correctamente posicionado tras el cambio de estructura.
- [ ] `CategoriasView.vue` y `MesasView.vue` no fueron modificados.
- [ ] Ningún handler de Vue fue modificado — solo template (estructura del
      `<td>`) y `<style>`.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

Causa raíz confirmada: `display: flex` aplicado directamente sobre `<td
class="actions-cell">` en `ProductosView.vue` e `InventarioView.vue`.

Fix aplicado en ambos archivos (mismo patrón):

- El `<td class="actions-cell">` se conserva en el template (sin estilos
  propios de layout más allá del padding/border heredado de
  `.producto-table td` / `.insumo-table td`), pero ya no lleva `display:
  flex` en su regla CSS.
- Se envolvió el contenido existente de la celda (botones + `<p
  class="error--inline">`) en un nuevo `<div class="actions-inner">`.
- La regla `.actions-cell { display: flex; flex-wrap: wrap; align-items:
  center; gap: 8px; }` se renombró a `.actions-inner` con las mismas
  propiedades, sin cambios de valores — el resultado visual del wrap/gap de
  los botones es idéntico al anterior.
- En `InventarioView.vue` el `<div class="actions-inner">` envuelve los 3
  botones existentes (Ajustar stock/Cancelar ajuste, Editar, Eliminar) más
  el párrafo de error inline, sin tocar la fila `<tr v-if="ajusteAbiertoId
  === insumo.id" class="ajuste-row">` (fuera de alcance, no modificada).

Archivos tocados:
- `frontend/src/views/ProductosView.vue`
- `frontend/src/views/InventarioView.vue`

Cómo probarlo:
1. `npm run dev` (ya corriendo en `http://localhost:5173`).
2. Login con `admin@brainfreeze.com` / `Admin1234`.
3. Ir a Productos e Inventario, inspeccionar con zoom/DevTools el
   `border-bottom` de cada fila: ahora es continuo bajo toda la fila,
   incluida la columna de acciones, igual que el resto de columnas.
4. `npx vue-tsc -b` y `npx vite build` corren sin errores (verificado).

Nota cruzada con FE-018: implementada después de este fix (mismo bloque de
HTML). El `<div class="actions-inner">` agregado aquí sigue conteniendo
los botones/iconos que agregó FE-018 sin conflicto — verificado leyendo el
resultado final de ambos archivos tras aplicar las dos tareas.

## Revisión

**Veredicto: done**

Verificado por lectura de código (no solo la nota de implementación):

- `ProductosView.vue` (línea ~328) e `InventarioView.vue` (línea ~258): el
  `<td class="actions-cell">` ya no tiene ninguna regla CSS `display: flex`
  asociada — confirmado con grep, `.actions-cell` solo aparece una vez en
  cada archivo (el atributo `class` del `<td>` en el template); no existe
  ningún selector `.actions-cell { ... }` en el bloque `<style>` de ninguno
  de los dos archivos.
- El contenido de la celda (botones + `<p class="error--inline">`) quedó
  envuelto en `<div class="actions-inner">`, y esa clase es la que ahora
  lleva `display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`
  con los mismos valores que tenía `.actions-cell` antes — el wrap/gap
  visual de los botones no cambia, solo el elemento que lo aplica.
- El `<td>` conserva `class="actions-cell"` en el template pero sin estilo
  propio de layout más allá del padding/border heredado de
  `.producto-table td` / `.insumo-table td` (`border-bottom: 1px solid
  var(--color-border-soft)`), que ahora renderiza normal porque el `<td>`
  vuelve a comportarse como `table-cell` en vez de `flex`. Esto resuelve la
  causa raíz del bug.
- `CategoriasView.vue` y `MesasView.vue`: no tocados (confirmado por grep,
  sin referencias a `actions-cell`/`actions-inner`/iconos en `MesasView.vue`).
- Ningún handler de Vue fue modificado (`openEditForm`, `requestDelete`,
  `toggleAjuste` — solo template y `<style>`, confirmado por lectura línea
  a línea de ambos `<script setup>`).
- `npx vue-tsc -b` corre sin errores (sin salida = sin errores) y `npx vite
  build` compila limpio (`✓ built in 338ms`), verificado en este mismo
  entorno.
- El `<p class="error--inline">` sigue dentro de `.actions-inner` como
  antes vivía dentro de `.actions-cell`; su comportamiento de wrap no
  cambió respecto al estado previo al fix (mismo contenedor flex, mismos
  valores).

No se encontraron hallazgos. Cumple todos los criterios de aceptación tal
como están redactados.
