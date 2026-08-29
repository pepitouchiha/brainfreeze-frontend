---
id: FE-018
title: Iconos SVG (lápiz/basurita) en botones Editar/Eliminar
area: frontend
status: done
priority: medium
depends_on: []
created_by: planner
---

## Objetivo

Reemplazar el texto plano "Editar"/"Eliminar" de los botones de acción por
iconos SVG inline (lápiz para editar, basurita para eliminar), siguiendo el
mismo patrón ya establecido en `frontend/src/components/layout/AppSidebar.vue`
(un `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
stroke-linecap="round" stroke-linejoin="round">` con los `<path>`/`<rect>`/etc.
dibujados a mano e inyectados vía `v-html`, o inline directo en el template —
sin traer ninguna librería de iconos de terceros ni font-icons).

## Alcance

Botones a convertir a icono, verificados por lectura de cada vista:

- `frontend/src/views/ProductosView.vue`: "Editar" y "Eliminar" dentro de
  `<td class="actions-cell">` (líneas ~326-335).
- `frontend/src/views/InventarioView.vue`: "Editar" y "Eliminar" dentro de
  `<td class="actions-cell">` (líneas ~256-268). El botón **"Ajustar
  stock"/"Cancelar ajuste"** (líneas ~257-259, primer botón de esa misma
  celda) **NO** está en alcance — se deja como texto, sin tocar.
- `frontend/src/views/CategoriasView.vue`: "Editar" y "Eliminar" dentro de
  `<div class="category-actions">` de cada tarjeta de categoría (líneas
  ~151-160).
- `frontend/src/views/MesasView.vue` **no aplica** — no tiene botones
  Editar/Eliminar (solo "Iniciar venta" y "Marcar libre"), fuera de alcance.

No incluye:
- Cambiar ningún handler (`openEditForm`, `requestDelete`, `toggleAjuste`) —
  solo el contenido visual del botón (markup interno + CSS del icono).
- Tocar el botón "Ajustar stock" de `InventarioView.vue`.
- Traer una librería de iconos (ej. `lucide-vue`, `heroicons`, fuentes de
  iconos) — el proyecto usa exclusivamente SVG dibujado a mano, como en
  `AppSidebar.vue` y en el placeholder de `ProductoThumbnail.vue` (FE-017).
- El botón "Quitar imagen" del formulario de `ProductosView.vue` (línea
  ~281) — es un botón de formulario distinto, no de fila/tarjeta de listado;
  no fue mencionado por el usuario, queda como texto.

Considerar, al implementar: cada botón "Eliminar" hoy cambia su texto a
"Eliminando…" mientras `deletingId === <id>` (con el botón `:disabled` en
ese estado). Al quitar el texto visible, ese feedback de "en progreso" ya
no es visible — debe preservarse de forma accesible (ver criterios).

## Criterios de aceptación

- [ ] Los botones "Editar" en `ProductosView.vue`, `InventarioView.vue` e
      `CategoriasView.vue` muestran un icono de lápiz (SVG inline, sin
      librería de terceros) en vez del texto "Editar".
- [ ] Los botones "Eliminar" en las mismas 3 vistas muestran un icono de
      basurita (SVG inline, sin librería de terceros) en vez del texto
      "Eliminar".
- [ ] Ambos iconos siguen el mismo patrón visual que `AppSidebar.vue`:
      `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, trazos
      (no formas rellenas), tamaño consistente entre sí (ej. 16-18px) y
      alineados verticalmente con el resto de contenido de la fila/tarjeta.
- [ ] Cada botón "Editar" tiene `aria-label` y `title` descriptivos y
      específicos a la entidad de esa vista (ej. `aria-label="Editar
      producto"` en Productos, `"Editar insumo"` en Inventario, `"Editar
      categoría"` en Categorías) — no un genérico `"Editar"` igual en las
      tres vistas.
- [ ] Cada botón "Eliminar" tiene `aria-label`/`title` equivalentes (ej.
      `"Eliminar producto"`/`"Eliminar insumo"`/`"Eliminar categoría"`), y
      mientras `deletingId === <id>` (estado antes cubierto por el texto
      "Eliminando…") el `aria-label` cambia a algo equivalente (ej.
      `"Eliminando producto…"`) o el botón expone `aria-busy="true"`, de
      forma que un lector de pantalla siga comunicando ese estado aunque ya
      no haya texto visible.
- [ ] El color semántico existente se preserva aplicado al icono: "Editar"
      en cian (`var(--color-cyan)`, clase `.btn-link`) y "Eliminar" en rojo
      (`var(--color-danger)`, clase `.btn-link--danger`), incluyendo los
      estados `:hover`/`:focus-visible`/`:disabled` ya definidos por FE-015
      (tinte de fondo, outline, opacity) — no se pierden esos estados al
      cambiar de texto a icono.
- [ ] El botón "Ajustar stock"/"Cancelar ajuste" de `InventarioView.vue`
      sigue siendo texto plano, sin modificar.
- [ ] `MesasView.vue` no fue modificado.
- [ ] Ningún handler de Vue (`openEditForm`, `requestDelete`, `toggleAjuste`)
      fue modificado — solo el contenido visual del botón.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

Se crearon dos componentes de icono reutilizables (evitando duplicar el
mismo SVG a mano 3 veces), siguiendo exactamente el patrón de
`AppSidebar.vue` (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`stroke-width="1.8"`, `stroke-linecap/linejoin="round"`):

- `frontend/src/components/icons/IconPencil.vue` (nuevo)
- `frontend/src/components/icons/IconTrash.vue` (nuevo)

Ambos son SVG puro sin `<script>` (no requieren props ni lógica), 16x16px
por defecto vía `<style scoped>`, con `aria-hidden="true"` y
`focusable="false"` en el propio `<svg>` porque el texto accesible del
botón lo aporta el `aria-label`/`title` del `<button>` padre (evita
duplicar/competir con lectores de pantalla).

Vistas modificadas (import de los dos iconos + reemplazo del texto por
`<IconPencil />` / `<IconTrash />` dentro del botón existente, sin tocar
ningún handler):

- `frontend/src/views/ProductosView.vue`: botones Editar/Eliminar de
  `<td class="actions-cell">` → `aria-label`/`title` = "Editar producto" /
  "Eliminar producto" (dinámico a "Eliminando producto…" + `aria-busy`
  mientras `deletingId === producto.id`).
- `frontend/src/views/InventarioView.vue`: mismo patrón con "Editar
  insumo" / "Eliminar insumo" / "Eliminando insumo…". El botón "Ajustar
  stock"/"Cancelar ajuste" (primer botón de la celda) se dejó intacto como
  texto plano, sin tocar.
- `frontend/src/views/CategoriasView.vue`: mismo patrón con "Editar
  categoría" / "Eliminar categoría" / "Eliminando categoría…" dentro de
  `<div class="category-actions">`.
- `frontend/src/views/MesasView.vue`: no tocado (no aplica, confirmado por
  lectura — solo tiene "Iniciar venta"/"Marcar libre").

En las 3 vistas se agregó `display: inline-flex; align-items: center;
justify-content: center;` a la regla `.btn-link` existente (antes solo
tenía estilos de texto) para centrar el icono dentro del botón —
manteniendo intactos los estados `:hover`/`:focus-visible`/`:disabled` y
los colores semánticos (`--color-cyan` para editar vía `.btn-link`,
`--color-danger` para eliminar vía `.btn-link--danger`) ya existentes de
FE-015, que siguen aplicando porque el icono hereda `stroke="currentColor"`
del color de texto del botón. Este ajuste también afecta visualmente al
botón "Ajustar stock"/"Cancelar ajuste" (sigue con texto, ahora centrado
en vez de alineado por línea de base — cambio no perceptible dado que ya
vive dentro de un `.actions-inner` con `align-items: center`) y al botón
"Quitar imagen" del formulario de `ProductosView.vue` (mismo efecto neutro,
fuera de alcance de esta tarea pero comparte la clase `.btn-link`).

Estado "Eliminando…" preservado de forma accesible sin texto visible:
`aria-label` dinámico + `aria-busy="true"` mientras el borrado está en
curso (cumple el criterio "aria-label cambia... o el botón expone
aria-busy", implementando ambos por redundancia).

Archivos nuevos:
- `frontend/src/components/icons/IconPencil.vue`
- `frontend/src/components/icons/IconTrash.vue`

Archivos tocados:
- `frontend/src/views/ProductosView.vue`
- `frontend/src/views/InventarioView.vue`
- `frontend/src/views/CategoriasView.vue`

Cómo probarlo:
1. `npm run dev` (ya corriendo en `http://localhost:5173`).
2. Login con `admin@brainfreeze.com` / `Admin1234`.
3. Ir a Productos, Inventario y Categorías: los botones Editar/Eliminar
   muestran icono de lápiz/basurita (cian/rojo) en vez de texto. Pasar el
   mouse encima muestra el `title` nativo; inspeccionar el DOM/AT (o
   DevTools Accessibility) confirma el `aria-label`.
4. Eliminar un producto/insumo/categoría y observar (con lector de
   pantalla o inspeccionando el DOM mientras la request está en curso) que
   el botón cambia a `aria-busy="true"` y `aria-label="Eliminando…"`.
5. `npx vue-tsc -b` y `npx vite build` corren sin errores (verificado).

Nota cruzada con FE-019: implementada después de ese fix, reutilizando el
`<div class="actions-inner">` que introdujo — los iconos quedan dentro de
ese wrapper, sin reintroducir `display: flex` en el `<td>`. Verificado
releyendo el resultado final de `ProductosView.vue` e `InventarioView.vue`.

## Revisión

**Veredicto: done**

Verificado por lectura de código y ejecución de type-check/build:

- `components/icons/IconPencil.vue` e `IconTrash.vue`: SVG puro sin
  `<script>`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-width="1.8"`, `stroke-linecap/linejoin="round"` — mismo patrón que
  `AppSidebar.vue`. 16x16px vía `<style scoped>`. Ambos con
  `aria-hidden="true"` y `focusable="false"` en el `<svg>`, correcto: el
  texto accesible lo aporta el `aria-label`/`title` del `<button>` padre, sin
  duplicar anuncio en lectores de pantalla. Sin librería de terceros, sin
  `v-html` con datos externos (los `<path>` están hardcodeados en el
  template, no hay riesgo XSS).
- `ProductosView.vue`, `InventarioView.vue`, `CategoriasView.vue`: los tres
  botones Editar/Eliminar tienen `aria-label`/`title` específicos por
  entidad ("Editar producto"/"Eliminar producto", "...insumo",
  "...categoría") — no genéricos.
- Estado "Eliminando…" preservado de forma accesible: `aria-label` dinámico
  ("Eliminando producto/insumo/categoría…") + `aria-busy="true"` mientras
  `deletingId === <id>`, en los tres archivos. Redundante mejor que
  insuficiente.
- Operabilidad por teclado intacta: siguen siendo elementos `<button
  type="button">` nativos, sin `tabindex` alterado ni handlers movidos a
  contenedores no interactivos; el `aria-hidden`/`focusable="false"` está
  en el `<svg>` hijo, no en el botón, así que el foco/activación por
  teclado (Enter/Space) sigue funcionando igual que antes con el texto.
- Color semántico preservado: `.btn-link` (cian, editar) y `.btn-link--danger`
  (rojo, eliminar) no perdieron sus reglas `:hover`/`:focus-visible`/
  `:disabled` de FE-015; el icono hereda el color vía `stroke="currentColor"`.
  Verificado leyendo el `<style scoped>` completo de las 3 vistas.
- `InventarioView.vue`: el botón "Ajustar stock"/"Cancelar ajuste" (primer
  botón de la celda) sigue siendo texto plano, sin `aria-label`/icono —
  correctamente fuera de alcance.
- `MesasView.vue`: no tocado (confirmado por grep, cero referencias a
  `IconPencil`/`IconTrash`/`actions-cell`/`actions-inner`).
- Ningún handler de Vue modificado (`openEditForm`, `requestDelete`,
  `toggleAjuste` intactos en firma y cuerpo).
- `npx vue-tsc -b` sin errores y `npx vite build` compila limpio, verificado
  en este entorno.
- Integración con FE-019 correcta: los iconos quedan dentro del
  `<div class="actions-inner">` introducido por ese fix, sin reintroducir
  `display: flex` en el `<td>`.

Un detalle menor, no bloqueante: el cambio a `.btn-link { display:
inline-flex; align-items: center; justify-content: center; }` (necesario
para centrar el icono) es una clase compartida, así que también afecta
visualmente al botón "Ajustar stock" (ya identificado y aceptado en las
notas de implementación como cambio neutro, dado que vive dentro de un
`.actions-inner` con `align-items: center`) y al botón "Quitar imagen" del
formulario de `ProductosView.vue` (fuera de alcance explícito de esta
tarea, pero comparte `.btn-link`). Es un efecto colateral inevitable de
reutilizar la clase existente en vez de duplicarla; no constituye scope
creep funcional (no se tocó contenido ni handler de esos botones) y ya fue
señalado con transparencia por el implementador. No amerita
`changes-requested`.

No se encontraron hallazgos bloqueantes. Cumple todos los criterios de
aceptación tal como están redactados.
