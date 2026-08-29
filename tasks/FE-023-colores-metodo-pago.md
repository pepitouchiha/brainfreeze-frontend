---
id: FE-023
title: Diferenciar color del segmented control de "Método de pago" (verde efectivo / naranja transferencia)
area: frontend
status: done
priority: low
depends_on: [FE-022]
created_by: planner
---

## Objetivo

El segmented control de "Método de pago" en `VentasView.vue`, implementado en
FE-022 (`done`), usa hoy el mismo gradiente púrpura genérico de `.btn-primary`
para el botón activo sin importar cuál esté seleccionado. El usuario pidió que
el color del botón activo comunique el método: **verde** cuando "Efectivo"
está seleccionado, **naranja** cuando "Transferencia" está seleccionada. No
cambia la estructura, accesibilidad ni comportamiento funcional definidos en
FE-022 — solo el color del estado activo de cada opción.

## Alcance

Verificado por lectura de código en `frontend/src/views/VentasView.vue` (tras
FE-022):

Template actual (líneas ~227-250):

```html
<div class="metodo-pago" role="radiogroup" aria-label="Método de pago">
  <button
    type="button"
    class="metodo-option"
    role="radio"
    :aria-checked="metodoPago === 'efectivo'"
    :class="{ 'metodo-option--active': metodoPago === 'efectivo' }"
    @click="metodoPago = 'efectivo'"
  >
    <IconBanknote />
    Efectivo
  </button>
  <button
    type="button"
    class="metodo-option"
    role="radio"
    :aria-checked="metodoPago === 'transferencia'"
    :class="{ 'metodo-option--active': metodoPago === 'transferencia' }"
    @click="metodoPago = 'transferencia'"
  >
    <IconTransfer />
    Transferencia
  </button>
</div>
```

CSS scoped actual (líneas ~468-506):

```css
.metodo-pago { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); }
.metodo-option { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: var(--color-text-muted); background: transparent; border: none; border-radius: var(--radius-sm); padding: 8px 10px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
.metodo-option:hover:not(.metodo-option--active) { color: var(--color-text); }
.metodo-option--active { color: #fff; background: linear-gradient(90deg, var(--color-purple), var(--color-purple-deep)); }
.metodo-option:focus-visible { outline: 2px solid var(--color-cyan); outline-offset: 2px; }
```

Paleta en `frontend/src/assets/styles/tokens.css` (líneas 1-27): no existe
ninguna variable de color naranja. Sí existe `--color-lime: #b2ff05` (un
verde-lima neón muy claro, usado hoy como `--color-success` y en estados
positivos/"OK"/"Disponible" del proyecto). No hay que crear un verde nuevo:
reutilizar `--color-lime` para el estado activo de "Efectivo". Sí hay que
**agregar una variable nueva** para naranja, ya que no existe ninguna — usar
un tono vibrante consistente con la estética neón oscura del resto de la
paleta (magenta `#ff007f`, cian `#00e5ff`, lima `#b2ff05`, púrpura `#7b2cbf`),
ej. `--color-orange: #ff8a1e` (a criterio del implementador el hex exacto,
pero debe ser un naranja saturado/vibrante, no un tono pastel ni marrón
apagado, y debe agregarse en `tokens.css` junto a las demás variables
`--color-*`, no hardcodearse directamente en el CSS scoped del componente).

Incluye:

1. En `tokens.css`, agregar `--color-orange` (o el nombre que el implementador
   prefiera, ej. `--color-amber`) con un hex concreto de naranja vibrante,
   siguiendo el mismo patrón que `--color-magenta`/`--color-cyan`/`--color-lime`.
   No modificar `--color-lime` ni `--color-success` (se reutilizan tal cual).
2. En el template, agregar una forma de distinguir por CSS cuál botón está
   activo *y* a qué método corresponde (no solo si está activo). Alternativas
   válidas a criterio del implementador, siempre que el resultado sea
   verificable en el DOM/CSS:
   - Agregar una clase modificadora fija a cada botón (ej.
     `class="metodo-option metodo-option--efectivo"` /
     `class="metodo-option metodo-option--transferencia"`) y usar selectores
     compuestos en CSS (`.metodo-option--active.metodo-option--efectivo`,
     `.metodo-option--active.metodo-option--transferencia`).
   - O reemplazar la única clase `metodo-option--active` por dos clases
     mutuamente excluyentes calculadas en el `:class` binding (ej.
     `'metodo-option--active-efectivo'` / `'metodo-option--active-transferencia'`)
     aplicadas condicionalmente según `metodoPago`.
   En cualquier caso: `role="radiogroup"`/`role="radio"`/`aria-checked`/`@click`
   ya definidos en FE-022 no se modifican en su lógica, solo se les puede
   agregar la clase adicional necesaria para el selector CSS.
3. Reemplazar la regla única `.metodo-option--active` (fondo púrpura para
   cualquiera de los dos) por dos reglas específicas:
   - Botón "Efectivo" activo: fondo con `var(--color-lime)` (sólido o
     gradiente sutil sobre el mismo tono, a criterio del implementador) y
     color de texto/icono con **contraste adecuado** sobre ese fondo claro y
     saturado — no reutilizar `#fff` como en el estado púrpura actual, ya que
     texto blanco sobre `--color-lime` (`#b2ff05`, muy claro) es prácticamente
     ilegible. Usar un color oscuro (ej. `var(--color-bg)`, `var(--color-surface)`,
     o un negro/casi-negro) para el texto y para que el ícono `<IconBanknote />`
     (que hereda `currentColor`) también se vea con contraste.
   - Botón "Transferencia" activo: fondo con `var(--color-orange)` (o el
     nombre elegido en el punto 1) y color de texto/icono legible sobre ese
     fondo (blanco es aceptable si el naranja elegido es suficientemente
     oscuro/saturado; verificar visualmente, documentar en notas la elección).
4. El botón inactivo (el que NO coincide con `metodoPago.value`) debe verse
   exactamente igual que hoy: fondo transparente, `var(--color-text-muted)`,
   sin ningún tinte de verde ni naranja — el color solo aparece cuando esa
   opción específica está activa.
5. Mantener sin cambios: `.metodo-pago` (track), `:hover:not(.metodo-option--active)`
   (o su equivalente tras el cambio de clases, adaptado si el nombre de la
   clase activa cambia), `:focus-visible` con outline cian, la transición
   `background 0.15s ease, color 0.15s ease`.

No incluye:

- Cambiar `role="radiogroup"`, `role="radio"`, `aria-checked`, los `@click`
  que asignan `metodoPago.value`, ni ningún otro comportamiento funcional
  definido en FE-022.
- Modificar `IconBanknote.vue` / `IconTransfer.vue` (contenido del SVG) — los
  iconos deben seguir heredando `currentColor` sin tocar su definición.
- Modificar `MetodoPago` en `frontend/src/api/types.ts`, `ticket.metodoPago`,
  el texto condicional del ticket de confirmación, ni `DashboardView.vue` /
  `.tag--transferencia`.
- Agregar navegación con flechas de teclado (fuera de alcance, ya documentado
  como no bloqueante en FE-022).
- Cambiar `--color-lime` / `--color-success` existentes, ni ningún otro token
  ya definido en `tokens.css` distinto del naranja nuevo a agregar.

## Criterios de aceptación

- [ ] `tokens.css` tiene una nueva variable de color naranja (ej.
      `--color-orange`) con un hex concreto de naranja vibrante/saturado,
      declarada junto a las demás variables `--color-*` existentes; no se
      modificó el valor de `--color-lime` ni de `--color-success`.
- [ ] Cuando `metodoPago === 'efectivo'`, el botón "Efectivo" se ve con fondo
      verde (`var(--color-lime)`, sólido o en gradiente) y el botón
      "Transferencia" se ve inactivo (fondo transparente/tenue, sin ningún
      tinte de color) — verificable inspeccionando el CSS computado o
      visualmente en `npm run dev`.
- [ ] Cuando `metodoPago === 'transferencia'`, el botón "Transferencia" se ve
      con fondo naranja (`var(--color-orange)` o el nombre elegido) y el
      botón "Efectivo" se ve inactivo — mutuamente excluyente, sin estado
      donde ambos o ninguno muestren color.
- [ ] El texto e ícono (`<IconBanknote />`) del botón "Efectivo" activo NO usan
      `#fff`/blanco puro sobre el fondo `var(--color-lime)`; usan un color
      oscuro con contraste legible (verificable leyendo el valor de `color`
      aplicado en esa regla CSS).
- [ ] El texto e ícono (`<IconTransfer />`) del botón "Transferencia" activo
      tienen contraste legible sobre `var(--color-orange)` (blanco u otro
      color oscuro, según el tono elegido — documentar la elección en notas).
- [ ] El botón inactivo (cualquiera de los dos, cuando no coincide con
      `metodoPago.value`) conserva la apariencia de FE-022: fondo transparente
      y `var(--color-text-muted)`, sin verde ni naranja aplicado por error.
- [ ] `role="radiogroup"`, `role="radio"`, `:aria-checked` y los `@click` que
      asignan `metodoPago.value` no fueron modificados en su lógica (solo se
      permite agregar clases CSS adicionales a los `<button>` si el
      implementador elige esa estrategia).
- [ ] `:focus-visible` sigue mostrando el outline cian (`var(--color-cyan)`)
      al tabular hasta cualquiera de los dos botones, sin importar cuál esté
      activo.
- [ ] `IconBanknote.vue` e `IconTransfer.vue` no fueron modificados (siguen
      heredando `currentColor` sin cambios en su SVG).
- [ ] `MetodoPago` en `frontend/src/api/types.ts`, `ticket.metodoPago`, el
      texto condicional del ticket de confirmación e `DashboardView.vue` no
      fueron modificados por esta tarea.
- [ ] El comportamiento de `onConfirmarVenta` (payload `metodo_pago:
      metodoPago.value`) y `resetVentaForm` (reset a `'efectivo'`) sigue
      intacto — esta tarea es exclusivamente visual.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- `tokens.css`: se agregó `--color-orange: #ff8a1e` junto a las demás
  variables `--color-*` (magenta/cyan/lime/purple). No se modificó
  `--color-lime` ni `--color-success`.
- `VentasView.vue` (template): se agregó una clase fija adicional a cada
  botón (`metodo-option--efectivo` / `metodo-option--transferencia`) sin
  tocar `role="radio"`, `:aria-checked` ni los `@click` que asignan
  `metodoPago.value`. La clase `metodo-option--active` sigue calculándose
  igual que en FE-022 vía el mismo `:class` binding condicional.
- `VentasView.vue` (CSS scoped): se reemplazó la regla única
  `.metodo-option--active` por dos reglas con selector compuesto:
  - `.metodo-option--active.metodo-option--efectivo`: fondo
    `var(--color-lime)` sólido, texto/ícono `var(--color-bg)` (oscuro) para
    contraste legible sobre el verde-lima claro (blanco quedaba ilegible).
  - `.metodo-option--active.metodo-option--transferencia`: fondo
    `var(--color-orange)`, texto/ícono también `var(--color-bg)` en lugar de
    blanco. Se calculó el contraste de blanco sobre `#ff8a1e` (~2.4:1, por
    debajo de WCAG AA) y se optó por texto oscuro (`var(--color-bg)`, ~8:1 de
    contraste) para asegurar legibilidad, en línea con la alternativa
    explícitamente permitida en la tarea ("blanco u otro color oscuro").
  - `.metodo-option`, `.metodo-pago`, `:hover:not(.metodo-option--active)` y
    `:focus-visible` (outline cian) quedaron sin cambios.
- El botón inactivo no recibe ninguna clase de color: conserva
  `background: transparent` y `color: var(--color-text-muted)` heredados de
  `.metodo-option`, ya que las nuevas reglas solo aplican cuando coincide
  `--active` y la clase de método correspondiente simultáneamente.
- No se tocó `IconBanknote.vue`, `IconTransfer.vue`, `types.ts`,
  `ticket.metodoPago`, el texto condicional del ticket ni `DashboardView.vue`.
- Verificación: `npx vue-tsc -b` sin errores; `npm run build` (incluye
  `vue-tsc -b && vite build`) completado sin errores.
- Prueba manual sugerida: `npm run dev`, ir a Ventas, agregar algo al
  carrito, alternar el segmented control "Método de pago" — "Efectivo" debe
  verse verde-lima con texto oscuro, "Transferencia" naranja con texto
  oscuro, y tabular con teclado debe mostrar el outline cian en cualquiera de
  los dos botones.

## Revisión

**Veredicto: `done`**

Verificado por lectura de código (`VentasView.vue` líneas 227-250 y 468-511,
`tokens.css` líneas 1-28) y ejecución de comandos:

- `tokens.css`: `--color-orange: #ff8a1e` (línea 16) agregado junto a las
  demás variables `--color-*`; `--color-lime` y `--color-success` intactos.
- `VentasView.vue` template: clases fijas `metodo-option--efectivo` /
  `metodo-option--transferencia` agregadas sin tocar `role="radiogroup"`,
  `role="radio"`, `:aria-checked` ni los `@click` que asignan
  `metodoPago.value` (líneas 227-250, idénticos a FE-022 salvo la clase
  extra).
- CSS: reglas compuestas `.metodo-option--active.metodo-option--efectivo`
  (fondo `var(--color-lime)`, texto `var(--color-bg)`) y
  `.metodo-option--active.metodo-option--transferencia` (fondo
  `var(--color-orange)`, texto `var(--color-bg)`), mutuamente excluyentes.
  El botón inactivo no recibe ninguna de las dos reglas y conserva
  `background: transparent` / `color: var(--color-text-muted)` de
  `.metodo-option`. `:hover:not(.metodo-option--active)` y
  `:focus-visible` (outline `var(--color-cyan)`) sin cambios.
- Íconos: `IconBanknote.vue` / `IconTransfer.vue` no modificados, siguen
  usando `stroke="currentColor"`, por lo que heredan el `color` de la regla
  activa correspondiente (`var(--color-bg)` en ambos casos) — se ven
  oscuros y legibles sobre ambos fondos.
- Contraste verificado por cálculo (relative luminance WCAG):
  `var(--color-bg)` (#0b0410) sobre `var(--color-lime)` (#b2ff05) ≈ 16.8:1;
  sobre `var(--color-orange)` (#ff8a1e) ≈ 8.6:1. Ambos superan
  ampliamente WCAG AA (4.5:1). La justificación documentada en notas de
  implementación (blanco sobre naranja ≈2.4:1, insuficiente) es correcta
  y confirmada con cálculo independiente.
- No se tocaron `types.ts` (`MetodoPago` intacto), `ticket.metodoPago`, el
  texto condicional del ticket, ni `DashboardView.vue`
  (`.tag--transferencia` presente y sin relación con este cambio).
- `npx vue-tsc -b`: sin errores.
- `npm run build` (`vue-tsc -b && vite build`): completado sin errores,
  genera `VentasView-*.css`/`.js` correctamente.

Todos los criterios de aceptación se cumplen. Sin hallazgos.
