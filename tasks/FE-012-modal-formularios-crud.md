---
id: FE-012
title: Modal reutilizable para formularios de alta/edición (Categorías, Productos, Inventario, Mesas)
area: frontend
status: done
priority: high
depends_on: [FE-003, FE-004, FE-005, FE-006]
created_by: planner
---

## Objetivo

Convertir los formularios de creación/edición que hoy se muestran inline
(una tarjeta de formulario aparece debajo del header, empujando el contenido,
al pulsar "+ Nueva categoría" / "+ Nuevo producto" / "+ Nuevo insumo" / "+
Nueva mesa") en popups modales, mediante un componente `BaseModal.vue`
reutilizable, tal como se ve en el mockup de referencia inspeccionado por el
planner.

## Alcance

- Nuevo componente `frontend/src/components/common/BaseModal.vue`: overlay
  oscuro semitransparente cubriendo toda la pantalla, con una tarjeta
  centrada que reutiliza la estética ya existente en el resto de la app
  (`background: var(--color-surface)`, `border: 1px solid
  var(--color-border-soft)`, `border-radius: var(--radius-lg)`, consistente
  con `tokens.css`). Debe cerrarse: al hacer click en el overlay (fuera de la
  tarjeta), al presionar `Escape`, y mediante el botón "Cancelar" propio de
  cada formulario. Exponer al menos un slot por defecto para el contenido del
  formulario (el título puede ir dentro del slot, como ya hace cada
  `<h2>{{ editingId === null ? 'Nuevo...' : 'Editar...' }}</h2>` en cada
  vista, o en un slot `title` aparte — decisión del frontend-dev).
- Verificado por grep, los 4 archivos con `<form v-if="isFormOpen">` inline a
  migrar son:
  - `frontend/src/views/CategoriasView.vue` (formulario en líneas 86-110).
  - `frontend/src/views/ProductosView.vue` (formulario en líneas 163-216).
  - `frontend/src/views/InventarioView.vue` (formulario en líneas 154-204).
  - `frontend/src/views/MesasView.vue` (formulario en líneas 73-95).
  En los 4 casos: envolver el `<form>` existente dentro de `<BaseModal>` en
  vez de mostrarlo inline debajo del header. La lógica de estado y
  comportamiento de cada vista (`isFormOpen`, `editingId`, `openCreateForm`,
  `openEditForm`, `closeForm`, `onSubmit`, manejo de `formError`) no cambia:
  solo cambia el contenedor visual que envuelve el formulario.
- `VentasView.vue` queda explícitamente fuera de esta tarea: no tiene un
  formulario de alta/edición de tipo CRUD — es el flujo completo del punto de
  venta (catálogo de productos + carrito + confirmación), no un popup de
  creación de una entidad, y convertirlo a modal no aplica aquí.
- No incluye: cambiar la validación, los campos, ni las llamadas a la API de
  ninguno de los 4 formularios.

## Criterios de aceptación

- [ ] Existe `frontend/src/components/common/BaseModal.vue`, reutilizado por
      las 4 vistas (Categorías, Productos, Inventario, Mesas) — no hay 4
      implementaciones de overlay/modal duplicadas entre vistas.
- [ ] Al pulsar "+ Nueva categoría" / "+ Nuevo producto" / "+ Nuevo insumo" /
      "+ Nueva mesa", el formulario correspondiente aparece como un popup
      centrado sobre un overlay oscuro, ya no inline debajo del header.
- [ ] Al hacer click fuera de la tarjeta del modal (sobre el overlay) o
      presionar `Escape`, el modal se cierra sin guardar cambios, igual que
      pulsar "Cancelar".
- [ ] Editar una categoría/producto/insumo existente sigue abriendo el mismo
      modal precargado con sus datos actuales, y guardar/cancelar/mostrar
      errores de validación o del backend (ej. 409 por nombre duplicado)
      sigue funcionando igual que antes de esta tarea.
- [ ] `VentasView.vue` no fue modificado por esta tarea.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Nuevo `frontend/src/components/common/BaseModal.vue`: usa `<Teleport
  to="body">` para que el overlay cubra toda la pantalla sin verse afectado
  por el stacking/contexto de flex de cada vista. Overlay
  (`position: fixed; inset: 0`) con fondo semitransparente oscuro; tarjeta
  centrada (`width: min(440px, 92vw)`) con la estética existente
  (`background: var(--color-surface)`, `border: 1px solid
  var(--color-border-soft)`, `border-radius: var(--radius-lg)`). Un único
  slot por defecto (el `<h2>` de título queda dentro del slot, tal como ya
  hacía cada vista — no se agregó un slot `title` aparte por mantener el
  cambio mínimo). Emite `close` en: click en el overlay
  (`@click.self`, para que clicks dentro de la tarjeta no propaguen cierre),
  `Escape` (listener en `window` agregado en `onMounted`/removido en
  `onUnmounted`, así que solo existe mientras el modal está montado). No
  gestiona su propio estado de visibilidad: el padre sigue controlando
  `isFormOpen` con `v-if` sobre `<BaseModal>`, igual que antes controlaba el
  `<form v-if="isFormOpen">`.
- Las 4 vistas (`CategoriasView.vue`, `ProductosView.vue`,
  `InventarioView.vue`, `MesasView.vue`) se migraron de forma idéntica:
  `<form v-if="isFormOpen" class="...-form" @submit.prevent="onSubmit">`
  pasó a `<BaseModal v-if="isFormOpen" @close="closeForm"><form
  class="...-form" @submit.prevent="onSubmit">...</form></BaseModal>`. Toda
  la lógica de estado (`isFormOpen`, `editingId`, `openCreateForm`,
  `openEditForm`, `closeForm`, `onSubmit`, `formError`) permanece sin
  cambios — solo cambió el contenedor visual.
- Las clases `.category-form`/`.producto-form`/`.insumo-form`/`.mesa-form`
  perdieron sus reglas de "tarjeta" (`background`, `border`,
  `border-radius`, `padding`, `max-width`) porque ahora ese estilo lo aporta
  `BaseModal`; conservan solo `display: flex; flex-direction: column; gap`
  para el layout interno de los campos. Sin este ajuste habría quedado una
  tarjeta duplicada dentro de otra tarjeta.
- `VentasView.vue` no fue tocado — confirmado que sigue igual, es el flujo
  de POS (catálogo + carrito + ticket), no un formulario CRUD de alta/edición.
- Archivos tocados: `frontend/src/components/common/BaseModal.vue` (nuevo),
  `frontend/src/views/CategoriasView.vue`, `frontend/src/views/ProductosView.vue`,
  `frontend/src/views/InventarioView.vue`, `frontend/src/views/MesasView.vue`.
- Cómo probarlo: `npm run dev`, iniciar sesión, y en Categorías/Productos/
  Inventario/Mesas pulsar el botón "+ Nueva…" — el formulario aparece como
  popup centrado sobre un overlay oscuro (ya no empuja el contenido debajo
  del header). Verificar que hacer click fuera de la tarjeta o presionar
  `Escape` cierra el modal sin guardar; que "Editar" en una fila existente
  abre el mismo modal precargado con sus datos (ej. color/nombre de una
  categoría); y que guardar/errores de validación (nombre vacío, precio
  inválido) o del backend (409 por nombre duplicado) siguen mostrándose
  igual que antes, dentro del modal.
- `npx vue-tsc -b` y `npm run build` (que ejecuta `vue-tsc -b && vite build`)
  corren sin errores. Verificado visualmente con Puppeteer/Edge headless:
  modal de "Nuevo producto" abierto, cierre por click en overlay, y modal de
  "Editar categoría" precargado con nombre y color existentes.

## Revisión

**Veredicto: done**

Verificado `frontend/src/components/common/BaseModal.vue` y las 4 vistas
migradas:

- `BaseModal.vue` usa `<Teleport to="body">`, overlay `position: fixed;
  inset: 0` con `@click.self` (evita que clicks dentro de la tarjeta
  propaguen cierre), listener de `Escape` agregado en `onMounted` y removido
  en `onUnmounted` (sin fugas de listener, ya que el padre desmonta el modal
  con `v-if`), y emite un único evento `close` consumido de forma idéntica
  por las 4 vistas. Estética consistente con `tokens.css`
  (`--color-surface`, `--color-border-soft`, `--radius-lg`).
- `CategoriasView.vue`, `ProductosView.vue`, `InventarioView.vue` y
  `MesasView.vue` migradas de forma idéntica: `<BaseModal v-if="isFormOpen"
  @close="closeForm">` envolviendo el `<form>` existente. Toda la lógica de
  estado (`isFormOpen`, `editingId`, `openCreateForm`, `openEditForm`,
  `closeForm`, `onSubmit`, `formError`) permanece sin cambios — verificado
  leyendo cada archivo completo, no solo el fragmento del modal. Las clases
  `.category-form`/`.producto-form`/`.insumo-form`/`.mesa-form` perdieron
  correctamente sus reglas de "tarjeta" (ahora las aporta `BaseModal`), sin
  quedar una tarjeta duplicada dentro de otra.
- `VentasView.vue` confirmado sin tocar (grep sin resultados para
  `BaseModal`/`isFormOpen` en ese archivo).
- `npx vue-tsc -b` y `npm run build` corren sin errores (verificado en este
  entorno, incluyendo el bundle separado `BaseModal-*.js`/`.css` generado
  por code-splitting de rutas).

Observación menor, no bloqueante: el modal no implementa focus trap ni
mueve el foco automáticamente al primer campo al abrirse, ni usa
`aria-labelledby` apuntando al `<h2>` de título (solo `role="dialog"
aria-modal="true"`). No estaba en los criterios de aceptación explícitos
(que solo piden cierre por overlay/Escape/Cancelar y reutilización), así
que no amerita `changes-requested`, pero queda como mejora de accesibilidad
recomendada para una futura tarea si se quiere pulir el componente.

Todos los criterios de aceptación se cumplen.
