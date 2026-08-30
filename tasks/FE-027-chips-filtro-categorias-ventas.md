---
id: FE-027
title: Reemplazar <select> de filtro de categorías por chips/pills en Ventas (POS)
area: frontend
status: done
priority: low
depends_on: []
created_by: planner
---

## Objetivo

El usuario pidió que el filtro de categorías del catálogo/POS en
`frontend/src/views/VentasView.vue` sea "más fiel al diseño propuesto en las
interfaces anteriormente": hoy es un `<select>` nativo; debe verse como una fila
de rectangulitos redondeados (chips/pills), consistente con el mockup original
del proyecto (`D:\.NET\BrainFreeze\Brainfreezee Panel (offline).html`), donde el
filtro de categorías (`catFilters`) se dibuja como una serie de `<span>` tipo tag
(`padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:500`), con
la categoría activa en un tono distinto (morado, `rgba(123,44,191,...)` con texto
claro) y el resto en el mismo estilo de tag "Bajo" del sistema (fondo cian tenue,
texto cian).

El mockup es un HTML estático (no indica interactividad real); esta tarea traduce
esa idea visual — chips redondeados en fila — a un filtro **funcional** dentro de
la app ya implementada, con estado visual claro de "seleccionado", reusando la
paleta y el lenguaje de "pill" que el proyecto ya usa en otros lados (clases
`.tag`/`.tag--*` de `DashboardView.vue`/`InventarioView.vue`, y el patrón de
botones-toggle accesibles `role="radiogroup"`/`role="radio"` que la propia
`VentasView.vue` ya usa para "Método de pago", líneas ~227-250).

Es un cambio puramente de UI: no debe alterar la lógica de filtrado ni el
contrato de datos existente.

## Alcance

Verificado por lectura de código en `frontend/src/views/VentasView.vue`.

Estado actual (líneas ~172-185):

```html
<div class="filters">
  <input v-model="search" type="text" class="search-input" placeholder="Buscar producto por nombre…" />
  <select v-model="categoriaFiltro" class="categoria-select">
    <option value="">Todas las categorías</option>
    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
      {{ categoria.nombre }}
    </option>
  </select>
</div>
```

CSS actual del select (líneas ~349-357):

```css
.categoria-select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
  min-width: 200px;
}
```

Estado reactivo: `const categoriaFiltro = ref<number | ''>('')` (línea ~34), usado
en `productosFiltrados` (líneas ~42-49):
`categoriaFiltro.value === '' || p.categoria_id === categoriaFiltro.value`.
`categorias` viene de `useCategorias()` (línea ~28), ya cargado en `onMounted`.

Incluye:

1. Reemplazar el `<select v-model="categoriaFiltro" class="categoria-select">`
   por un contenedor de chips dentro de `.filters` (mismo lugar, junto al
   `search-input`): un `<button type="button">` "Todas" (equivalente a
   `<option value="">`) seguido de un `<button type="button">` por cada
   `categoria in categorias`, mostrando `categoria.nombre`.
2. Accesibilidad, mismo patrón ya usado en el bloque "Método de pago" de esta
   misma vista (líneas ~227-250, precedente directo a reutilizar, no reinventar):
   - Contenedor con `role="radiogroup"` y `aria-label` descriptivo (ej.
     `"Filtrar por categoría"`).
   - Cada `<button>` con `role="radio"` y `:aria-checked` reflejando si esa
     opción coincide con `categoriaFiltro.value` (`true` para "Todas" cuando
     `categoriaFiltro === ''`, `true` para la categoría cuando
     `categoriaFiltro === categoria.id`).
   - Botones nativos `<button type="button">`, operables con Tab + Enter/Espacio
     sin JS adicional. No es obligatorio implementar navegación con flechas
     izquierda/derecha de `radiogroup` nativo (mismo criterio ya documentado en
     FE-022 para "Método de pago"; si no se implementa, dejar constancia en
     Notas de implementación).
3. Click en el chip "Todas" asigna `categoriaFiltro.value = ''`; click en el chip
   de una categoría asigna `categoriaFiltro.value = categoria.id`. No se toca
   `productosFiltrados` (líneas ~42-49): la lógica de filtrado ya funciona con
   cualquier forma de asignar `categoriaFiltro.value`.
4. Estilo pill/chip, tomando como referencia la paleta y radio ya usados en el
   proyecto para tags (`.tag` de `DashboardView.vue`/`InventarioView.vue`:
   `border-radius: 999px`, `padding: 4px 10px`, `font-size: 12px`,
   `font-weight: 600`), sin inventar colores hex nuevos fuera de
   `frontend/src/assets/styles/tokens.css`:
   - Chip inactivo: mismo estilo tipo `.tag--bajo`/`.tag--efectivo` ya existente
     en el proyecto (fondo cian tenue + borde + texto cian — reutilizar
     literalmente los valores ya usados en esas clases, ej.
     `background: rgba(0, 229, 255, 0.14); color: var(--color-cyan); border: 1px
     solid rgba(0, 229, 255, 0.4);`), en vez de definir un tinte nuevo.
   - Chip activo (el que coincide con `categoriaFiltro.value`): un tono
     distinguible del inactivo, inspirado en el acento morado que el mockup usa
     para la categoría activa (`--color-purple` / `--color-border` ya definidos
     en `tokens.css`, ej. fondo `rgba(123, 44, 191, 0.35)` con texto
     `var(--color-text)` o similar) — a criterio del implementador el tono
     exacto, siempre que solo use tokens/valores ya presentes en el proyecto y
     el contraste texto/fondo sea legible.
   - `:hover` en chips inactivos con algún cambio sutil (ej. subir opacidad o
     borde), no obligatorio pero deseable por consistencia con el resto de
     controles interactivos de la vista.
   - `:focus-visible` con `outline: 2px solid var(--color-cyan)`, mismo patrón
     que `.metodo-option:focus-visible` (línea ~508) y otros controles del
     proyecto (`ToggleSwitch.vue`, `NumberInput.vue`).
5. El contenedor de chips debe tener `flex-wrap: wrap` (como ya tiene `.filters`,
   línea ~332-336) para no desbordar horizontalmente si hay muchas categorías.
   Layout dentro de `.filters` (misma fila que el buscador, o fila propia debajo)
   queda a criterio del implementador, siempre que se vea ordenado y responsivo.
6. Si `categorias` está vacío (edge case, ej. antes de que cargue o sin datos),
   solo debe mostrarse el chip "Todas", sin errores ni chips vacíos.

No incluye:

- Tocar `frontend/src/views/ProductosView.vue`, que tiene el mismo patrón
  `<select v-model="categoriaFiltro" class="categoria-select" @change="onCategoriaFiltroChange">`
  (línea ~243) para su propio filtro de categoría en la tabla — el usuario pidió
  específicamente la vista de Ventas. Ese `<select>` además tiene un
  `@change="onCategoriaFiltroChange"` adicional que no existe en Ventas (usa
  `categoriaFiltro` también para prellenar el formulario de alta), por lo que
  replicar este cambio ahí requeriría analizarlo aparte; queda como posible
  follow-up no planificado, no forma parte del alcance de esta tarea.
- Cambiar el tipo o la declaración de `categoriaFiltro`
  (`ref<number | ''>('')`, línea ~34): sigue siendo el mismo ref, solo cambia
  cómo se le asigna valor desde la UI.
- Modificar `productosFiltrados` (líneas ~42-49), `categoriaNombre` (línea
  ~67-69), ni ningún otro computed/handler de la vista.
- Tocar el `<select id="venta-mesa">` de selección de mesa (línea ~216) ni el
  bloque "Método de pago" (líneas ~225-251) — solo se reutiliza su patrón de
  accesibilidad como referencia, no se modifica ese código.
- Tocar `frontend/src/assets/styles/tokens.css`, `DashboardView.vue`,
  `InventarioView.vue`, ni ningún composable (`useCategorias`, `useProductos`,
  etc.) — los cambios se limitan a `VentasView.vue`.
- Crear un componente reutilizable nuevo (ej. `CategoryChips.vue`) — a criterio
  del implementador si lo considera más limpio, pero no es requisito de esta
  tarea (este filtro solo se usa en `VentasView.vue`).

## Criterios de aceptación

- [ ] El `<select v-model="categoriaFiltro" class="categoria-select">` ya no
      existe en `VentasView.vue` (verificable con grep: no queda ningún
      `<select>` para filtro de categoría en el archivo).
- [ ] En su lugar hay un contenedor con `role="radiogroup"` y un `aria-label`
      descriptivo, que contiene un `<button type="button">` "Todas" más un
      `<button type="button">` por cada elemento de `categorias`, mostrando
      `categoria.nombre` como texto de cada chip.
- [ ] Click en el chip "Todas" deja `categoriaFiltro.value === ''`; click en el
      chip de una categoría deja `categoriaFiltro.value === categoria.id` de esa
      categoría — verificable revisando el handler de cada botón.
- [ ] Solo un chip puede estar "activo" a la vez, siempre coincidiendo con
      `categoriaFiltro.value` (mutuamente excluyentes, sin estado intermedio
      donde varios o ninguno se vean seleccionados).
- [ ] Cada `<button>` tiene `role="radio"` y `:aria-checked` reflejando
      correctamente si es la opción seleccionada; el contenedor padre tiene
      `role="radiogroup"` con `aria-label` — verificable inspeccionando el HTML
      renderizado al cambiar de chip.
- [ ] Los chips son operables con teclado: tabular hasta un chip y presionar
      Enter o Espacio cambia `categoriaFiltro.value` al valor de ese chip
      (comportamiento nativo de `<button>`, sin JS adicional requerido).
- [ ] Visualmente, el chip activo se distingue con claridad del resto (fondo/color
      distinto, no solo un borde sutil) — verificable en `npm run dev` sin
      ambigüedad sobre cuál categoría está filtrando.
- [ ] Los chips inactivos y el chip activo usan únicamente colores definidos en
      `frontend/src/assets/styles/tokens.css` (vía `var(--color-*)` o valores
      `rgba(...)` que ya se usan en otras partes del proyecto para tags, ej. los
      mismos de `.tag--bajo`/`.tag--efectivo`) — no se introduce ningún color hex
      nuevo fuera de `tokens.css`.
- [ ] Los chips tienen `border-radius: 999px` (o equivalente pill, consistente
      con `.tag` de `DashboardView.vue`/`InventarioView.vue`), no el
      `var(--radius-sm)`/`var(--radius-md)` cuadrado que usaba el `<select>`
      anterior.
- [ ] El contenedor de chips tiene `flex-wrap: wrap` (o hereda ese
      comportamiento de `.filters`), verificable con muchas categorías sin
      desbordar horizontalmente el layout.
- [ ] Cada chip tiene `outline: 2px solid var(--color-cyan)` (u otro estilo
      visible equivalente) en `:focus-visible`.
- [ ] Si `categorias` está vacío, solo se renderiza el chip "Todas", sin errores
      en consola ni chips vacíos.
- [ ] `productosFiltrados` (líneas ~42-49 antes del cambio) no fue modificado y
      el filtrado por categoría sigue funcionando igual que antes (probar:
      seleccionar una categoría muestra solo productos de esa categoría;
      seleccionar "Todas" muestra todos los productos, combinado correctamente
      con el buscador de texto).
- [ ] `categoriaFiltro` sigue siendo `ref<number | ''>('')`, sin cambiar su tipo
      ni su declaración.
- [ ] `frontend/src/views/ProductosView.vue`, `DashboardView.vue`,
      `InventarioView.vue`, `frontend/src/assets/styles/tokens.css`, y los
      composables (`useCategorias`, `useProductos`, etc.) no fueron modificados
      por esta tarea.
- [ ] El bloque "Método de pago" (líneas ~225-251) y el `<select id="venta-mesa">`
      de selección de mesa no fueron modificados.
- [ ] `npx vue-tsc -b` y `npx vite build` (o `npm run build`) corren sin errores.

## Notas de implementación

Cambios únicamente en `frontend/src/views/VentasView.vue` (template y `<style scoped>`),
sin tocar `<script setup>` ni ningún otro archivo:

- Reemplazado el `<select v-model="categoriaFiltro" class="categoria-select">` por un
  `<div class="categoria-chips" role="radiogroup" aria-label="Filtrar por categoría">`
  dentro de `.filters`, junto al `search-input`, con un `<button type="button">` "Todas"
  seguido de un `<button type="button" v-for="categoria in categorias">` por categoría
  (`categoria.nombre` como texto).
- Cada botón usa `role="radio"` y `:aria-checked` comparando contra `categoriaFiltro.value`
  (`categoriaFiltro === ''` para "Todas", `categoriaFiltro === categoria.id` para cada
  categoría), mismo patrón que `.metodo-pago`/`.metodo-option` de esta misma vista
  (líneas ~227-250, sin modificar). No se implementó navegación con flechas
  izquierda/derecha del `radiogroup` nativo — igual criterio ya documentado en FE-022 para
  "Método de pago": los botones son operables con Tab + Enter/Espacio de forma nativa, que
  cubre el criterio de aceptación de teclado.
- `@click` en cada chip asigna directamente `categoriaFiltro.value = ''` o
  `categoriaFiltro.value = categoria.id`; no se tocó `productosFiltrados` (líneas ~42-49),
  que sigue leyendo `categoriaFiltro.value` sin cambios — el filtrado por categoría y su
  combinación con el buscador de texto siguen funcionando igual.
- CSS: se eliminó `.categoria-select` y se agregaron `.categoria-chips` (contenedor,
  `display:flex; flex-wrap:wrap; gap:8px`), `.categoria-chip` (pill,
  `border-radius:999px; padding:4px 10px; font-size:12px; font-weight:600`, con la misma
  paleta de `.tag--bajo`/`.tag--efectivo` de `DashboardView.vue`/`InventarioView.vue`:
  `background: rgba(0, 229, 255, 0.14); color: var(--color-cyan); border: 1px solid
  rgba(0, 229, 255, 0.4);`) y `.categoria-chip--active` (fondo
  `rgba(123, 44, 191, 0.35)` con `border: 1px solid var(--color-border)` y
  `color: var(--color-text)`, tono morado inspirado en `--color-purple`/`--color-border`
  de `tokens.css`, sin introducir ningún hex nuevo). Se agregó `:hover` sutil en chips
  inactivos (`background: rgba(0, 229, 255, 0.22)`) y `:focus-visible { outline: 2px
  solid var(--color-cyan); outline-offset: 2px; }`, igual que `.metodo-option:focus-visible`.
- Edge case: si `categorias` está vacío, el `v-for` no renderiza nada y solo queda el
  chip "Todas"; no hay lógica adicional que pueda fallar antes de que `categorias` cargue.
- No se creó ningún componente nuevo (`CategoryChips.vue`); se mantuvo todo local a
  `VentasView.vue` como en el resto del filtro existente.

Verificación:
- `npx vue-tsc -b` → sin errores.
- `npx vite build` → build exitoso (`VentasView-*.css`/`.js` generados sin warnings
  relacionados).
- No se tocaron `ProductosView.vue`, `DashboardView.vue`, `InventarioView.vue`,
  `tokens.css` ni ningún composable — confirmado con grep dentro de
  `VentasView.vue` (`categoria-select` ya no aparece; `categoriaFiltro` solo aparece en
  la declaración del ref, en `productosFiltrados` y en el nuevo markup de chips).

Prueba manual sugerida: `npm run dev` dentro de `frontend/`, ir a la vista Ventas (POS),
con varias categorías cargadas — verificar que "Todas" está activo por defecto, que al
hacer click en un chip de categoría el catálogo se filtra y el chip se resalta en morado
(el resto queda en el tono cian inactivo), que tabular con teclado hasta un chip y
presionar Enter/Espacio también cambia el filtro, y que combinar el buscador de texto con
un chip de categoría filtra por ambos criterios a la vez.

## Revisión

**Veredicto: done**

Revisión de `frontend/src/views/VentasView.vue` completa (script setup, template
y estilos), más lectura cruzada de `tokens.css`, `DashboardView.vue` (`.tag`,
`.tag--bajo`, `.tag--efectivo`) e `InventarioView.vue`/`ProductosView.vue`.

Verificaciones realizadas:

- `<select v-model="categoriaFiltro" class="categoria-select">` eliminado; el
  único `<select>` restante en el archivo es `#venta-mesa` (línea 234), sin
  tocar. Confirmado con grep (`categoria-select|<select>`).
- Nuevo `<div class="categoria-chips" role="radiogroup" aria-label="Filtrar por
  categoría">` (línea 179) con botón "Todas" + `v-for` de categorías (líneas
  180-201), cada uno `type="button"`, `role="radio"`, `:aria-checked` comparando
  contra `categoriaFiltro.value`, mismo patrón que `.metodo-pago`/`.metodo-option`
  (líneas 245-268, sin modificar). Mutuamente excluyentes: correcto, un solo
  chip puede coincidir con `categoriaFiltro.value` a la vez.
- `@click` asigna directamente `categoriaFiltro.value = ''` o `= categoria.id`
  (líneas 186, 198); operables con Tab + Enter/Espacio por ser `<button>`
  nativos, sin JS adicional — igual criterio documentado que "Método de pago".
- `productosFiltrados` (líneas 42-49) y la declaración `const categoriaFiltro =
  ref<number | ''>('')` (línea 34) quedaron intactas — verificado leyendo el
  `<script setup>` completo, sin diffs respecto a la lógica original.
- CSS: `.categoria-chip` con `border-radius: 999px; padding: 4px 10px;
  font-size: 12px; font-weight: 600` (pill real), inactivo con `background:
  rgba(0, 229, 255, 0.14); color: var(--color-cyan); border: 1px solid
  rgba(0, 229, 255, 0.4)` — coincide exactamente con `.tag--bajo`/`.tag--efectivo`
  de `DashboardView.vue` (líneas 284-300), sin hex nuevo. Chip activo con
  `background: rgba(123, 44, 191, 0.35)` (derivado de `--color-purple:
  #7b2cbf` = `rgb(123, 44, 191)`) + `border: 1px solid var(--color-border)` +
  `color: var(--color-text)` — distinguible con claridad, sin hex inventado
  fuera de `tokens.css`. `:hover` sutil en inactivos y `:focus-visible {
  outline: 2px solid var(--color-cyan); outline-offset: 2px }` presentes,
  igual patrón que `.metodo-option:focus-visible`.
- `.categoria-chips` tiene `flex-wrap: wrap` propio (además de heredarlo de
  `.filters`). Edge case de `categorias` vacío: el `v-for` simplemente no
  renderiza nada, solo queda "Todas" — sin lógica adicional que pueda fallar.
- Fuera de alcance respetado: `ProductosView.vue` conserva intacto su
  `<select v-model="categoriaFiltro" class="categoria-select"
  @change="onCategoriaFiltroChange">` (línea 256) y `.categoria-select` (línea
  541) — confirmado con grep. `DashboardView.vue` e `InventarioView.vue` no
  contienen ninguna clase `categoria-chip`/`categoria-chips` filtrada por error
  (grep sin matches). `tokens.css` no fue tocado (solo se leen sus variables).
  Bloque "Método de pago" (líneas 245-268) y `<select id="venta-mesa">` (línea
  234) sin cambios.
- `npx vue-tsc -b` → sin errores. `npx vite build` → build exitoso, genera
  `VentasView-*.css`/`.js` sin warnings.

No se encontraron hallazgos. La implementación cumple todos los criterios de
aceptación, respeta el alcance declarado (no toca `ProductosView.vue` ni otros
archivos) y reutiliza fielmente el patrón de accesibilidad y paleta ya
existentes en el proyecto.
