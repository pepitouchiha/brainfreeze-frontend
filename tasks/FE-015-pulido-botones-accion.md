---
id: FE-015
title: Pulido visual de botones de acción (Inventario, Productos, Categorías, Mesas)
area: frontend
status: done
priority: low
depends_on: []
created_by: planner
---

## Objetivo

Los botones de acción en 4 vistas usan hoy un patrón `.btn-link` de texto
plano sin estados de hover/focus definidos más allá de `:disabled { opacity:
0.6 }`, y en algunos casos quedan muy juntos entre sí (`gap: 4px` en
`.actions-cell`). Pulir su jerarquía visual y feedback de interacción sin
tocar la lógica funcional. Antes de implementar, consultar
`.agents/skills/frontend-design/SKILL.md` para las decisiones de
jerarquía/estado/hover (nota: el pedido original la referenciaba en
`.claude/skills/frontend-design`, pero verificado por Glob que la skill
real vive en `.agents/skills/frontend-design/` — usar esa ruta).

## Alcance

Botones a pulir, verificados por lectura de cada vista:

- `frontend/src/views/InventarioView.vue`: "Ajustar stock", "Editar",
  "Eliminar" en `.actions-cell` (líneas ~237-248), hoy los 3 son
  `.btn-link`/`.btn-link--danger` con `gap: 4px`.
- `frontend/src/views/ProductosView.vue`: "Editar", "Eliminar" en
  `.actions-cell` (líneas ~246-254), mismo patrón `.btn-link`.
- `frontend/src/views/CategoriasView.vue`: "Editar", "Eliminar" en
  `.category-actions` de cada tarjeta de categoría (líneas ~132-140), mismo
  patrón `.btn-link`/`.btn-link--danger`. (El pedido original no
  especificó qué botones de Categorías pulir; el planner define el alcance
  como estos dos, por ser el mismo patrón que las otras vistas.)
- `frontend/src/views/MesasView.vue`: agregar transición de hover a
  "Iniciar venta" (`.btn-secondary`, línea ~114) y "Marcar libre"
  (`.btn-link`, línea ~117) — hoy ninguna de las dos reglas CSS scoped a
  esta vista tiene `transition` definida.

No incluye:
- Cambiar la lógica de ningún handler (`onDelete`, `openEditForm`,
  `toggleAjuste`, `onIniciarVenta`, `onLiberar`) — solo markup/CSS.
- El modal de confirmación de eliminar (FE-013) ni el sistema de toasts
  (FE-014) — esas son tareas de comportamiento, independientes de esta.
  Ambas tareas tocan los mismos botones "Eliminar"; si se implementan en
  paralelo o en cualquier orden, el frontend-dev debe revisar que los
  cambios de markup de esta tarea no rompan el `@click` cableado por
  FE-013 (y viceversa) al mezclarlos.
- No se agrega ninguna acción nueva a ninguna vista.

## Criterios de aceptación

- [ ] Se consultó `.agents/skills/frontend-design/SKILL.md` antes de decidir
      la jerarquía visual/estados de hover — indicar en "Notas de
      implementación" qué principios concretos de la skill se aplicaron.
- [ ] Los botones "Ajustar stock"/"Editar"/"Eliminar" en Inventario, y
      "Editar"/"Eliminar" en Productos y Categorías, tienen un estado de
      hover/focus visualmente distinguible (no solo el `opacity: 0.6` que
      hoy solo aplica a `:disabled`), con una transición suave (no un
      cambio instantáneo).
- [ ] El espaciado entre los botones de la columna/fila de acciones ya no
      se percibe "pegado" (ajustar `gap`/padding respecto al valor actual).
- [ ] El botón "Eliminar" se distingue visualmente de "Editar"/"Ajustar
      stock" más allá del color de texto (ej. fondo tenue rojo en hover),
      de forma consistente entre Inventario, Productos y Categorías.
- [ ] En `MesasView.vue`, "Iniciar venta" y "Marcar libre" tienen una
      transición de hover definida (ej. `transition: background-color .15s
      ease` o equivalente).
- [ ] Ningún handler de Vue (`onDelete`, `openEditForm`, `toggleAjuste`,
      `onIniciarVenta`, `onLiberar`) fue modificado — solo template/CSS.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Se consultó `.agents/skills/frontend-design/SKILL.md` antes de tocar el
  CSS. Principios aplicados concretamente (nota: la skill está pensada
  para diseño de página completa/identidad visual; aquí se aplicó solo a
  la parte relevante para pulir componentes existentes dentro de un
  sistema ya establecido, sin reinventar paleta/tipografía):
  - "Match complexity to the vision": esta es una app CRUD densa en datos
    con una identidad neón ya fijada en `tokens.css` — se optó por un
    pulido preciso y contenido (transición sutil de 150ms, tinte de fondo
    de baja opacidad) en vez de efectos llamativos que no encajan con el
    resto de la UI ya construida.
  - "Leverage motion deliberately": se agregó `transition:
    background-color .15s ease, color .15s ease` a los botones de acción
    — motion con propósito (feedback de hover/focus), no decorativo, y sin
    animaciones adicionales.
  - "Structure is information": "Eliminar" ahora se distingue de
    "Editar"/"Ajustar stock" no solo por el color de texto sino por un
    tinte de fondo rojo (`rgba(255, 77, 109, .14)`) al hacer hover,
    reforzando que es una acción destructiva — la jerarquía visual
    comunica el riesgo de la acción, no solo decora.
  - Restraint (sección "Restraint and self-critique"): se evitó introducir
    sombras, escalados o colores nuevos fuera de la paleta de
    `tokens.css`; solo se reutilizaron `--color-cyan`, `--color-danger`,
    `--color-purple` y `--radius-sm`/`--radius-md` ya existentes.
- `InventarioView.vue`, `ProductosView.vue`, `CategoriasView.vue`: la
  clase compartida `.btn-link`/`.btn-link--danger` (duplicada por archivo,
  ya que cada vista tiene su CSS scoped propio — no existe un design
  system central de componentes de botón) ahora tiene `padding: 6px 10px`,
  `border-radius: var(--radius-sm)`, `transition` en `background-color` y
  `color`, un estado `:hover:not(:disabled)` con fondo cian tenue (o rojo
  tenue para `--danger`) y texto ligeramente más brillante, y
  `:focus-visible` con `outline` visible (cian o rojo según variante) para
  accesibilidad de teclado — no estaba en los criterios explícitos pero es
  consistente con "critique your own work" / calidad base de la skill. El
  `gap` de `.actions-cell` (Inventario, Productos) y `.category-actions`
  (Categorías) pasó de `4px` a `8px` para que los botones ya no se sientan
  "pegados".
- `MesasView.vue`: se agregó `transition: background-color .15s ease,
  border-color .15s ease` + estado `:hover`/`:focus-visible` a
  `.btn-secondary` ("Iniciar venta", tinte púrpura tenue en hover) y el
  mismo tratamiento de `.btn-link` ("Marcar libre") usado en las otras 3
  vistas. No se tocó el `gap` de `.mesa-actions` (no estaba pedido para
  esta vista, solo la transición de hover).
- Ningún handler (`onDelete`→ahora `requestDelete`/`confirmDelete` por
  FE-013, `openEditForm`, `toggleAjuste`, `onIniciarVenta`, `onLiberar`)
  fue modificado por esta tarea — solo `<style>` (y el `gap` en la misma
  regla CSS ya tocada). Esta tarea se implementó después de FE-013 según
  el orden indicado, así que el pulido de "Eliminar" ya contempla que ese
  botón abre `ConfirmModal` en vez de eliminar directo; no hubo conflicto
  de markup entre ambas tareas.
- Archivos tocados: `frontend/src/views/InventarioView.vue`,
  `frontend/src/views/ProductosView.vue`,
  `frontend/src/views/CategoriasView.vue`, `frontend/src/views/MesasView.vue`
  (solo bloques `<style>`).
- Cómo probarlo: `npm run dev`, iniciar sesión, y pasar el mouse (o
  navegar con Tab) sobre "Ajustar stock"/"Editar"/"Eliminar" en
  Inventario, "Editar"/"Eliminar" en Productos y Categorías — debe verse
  una transición suave de fondo/color al hover y foco, con "Eliminar"
  distinguible por su tinte rojo. En Mesas, hover sobre "Iniciar venta" y
  "Marcar libre" también debe mostrar una transición suave.
- No se pudo verificar visualmente con captura de pantalla en este
  entorno (no hay Chrome/Edge ni Puppeteer/Playwright instalado
  localmente para headless screenshot); verificado por lectura de CSS y
  `npx vue-tsc -b` / `npm run build` sin errores.

## Revisión

**Veredicto: done**

Verificado por lectura de código (`<style scoped>` de las 4 vistas):

- `InventarioView.vue`, `ProductosView.vue`, `CategoriasView.vue`:
  `.btn-link`/`.btn-link--danger` tienen `transition: background-color
  .15s ease, color .15s ease`, `:hover:not(:disabled)` con tinte de fondo
  (cian para acciones normales, rojo `rgba(255,77,109,.14)` para
  "Eliminar") y `:focus-visible` con `outline`. El `gap` de
  `.actions-cell`/`.category-actions` pasó de `4px` a `8px`.
- `MesasView.vue`: `.btn-secondary` ("Iniciar venta") y `.btn-link`
  ("Marcar libre") tienen `transition`/`:hover`/`:focus-visible`
  agregados, consistentes con las otras 3 vistas.
- Ningún handler (`requestDelete`/`confirmDelete` de FE-013,
  `openEditForm`, `toggleAjuste`, `onIniciarVenta`, `onLiberar`) fue
  modificado — solo bloques `<style>` y el atributo `gap` de reglas CSS ya
  existentes. Confirmado que el pulido convive sin fricción con los
  cambios de markup de FE-013 (el botón "Eliminar" ahora abre
  `ConfirmModal` en vez de eliminar directo, y el estilo pulido se aplica
  igual) y con la nueva columna de miniatura de FE-017 en
  `ProductosView.vue` — no hay clases CSS duplicadas ni pisadas entre las
  tareas que tocaron los mismos archivos en secuencia.
- `.agents/skills/frontend-design/SKILL.md` sí existe en la ruta corregida
  y las notas de implementación listan principios concretos aplicados.
- `npx vue-tsc -b` y `npx vite build` corren sin errores sobre el estado
  final del árbol.

Sin hallazgos. Cumple los 7 criterios de aceptación.
