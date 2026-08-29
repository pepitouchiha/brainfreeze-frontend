---
id: FE-022
title: Reemplazar radio buttons de "Método de pago" por segmented control de botones
area: frontend
status: done
priority: low
depends_on: []
created_by: planner
---

## Objetivo

El usuario pidió cambiar la interacción visual del selector "Método de pago" del
carrito en `VentasView.vue` (POS): hoy son dos radio buttons con círculo nativo;
debe convertirse en un "segmented control" — dos botones pegados/agrupados donde
solo uno puede estar activo a la vez ("Efectivo" / "Transferencia"), mismo
comportamiento de selección única, apariencia distinta. No cambia qué se
selecciona ni para qué se usa, solo cómo se selecciona visualmente.

## Alcance

Verificado por lectura de código en `frontend/src/views/VentasView.vue` (tras
FE-021, líneas ~225-238):

```html
<div class="form-row">
  <label>Método de pago</label>
  <div class="metodo-pago">
    <label class="metodo-option">
      <input v-model="metodoPago" type="radio" name="metodo-pago" value="efectivo" />
      <IconBanknote />
      Efectivo
    </label>
    <label class="metodo-option">
      <input v-model="metodoPago" type="radio" name="metodo-pago" value="transferencia" />
      <IconTransfer />
      Transferencia
    </label>
  </div>
</div>
```

CSS scoped actual (líneas ~456-468):

```css
.metodo-pago {
  display: flex;
  gap: 16px;
}

.metodo-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--color-text);
  cursor: pointer;
}
```

El estado reactivo es `const metodoPago = ref<MetodoPago>('efectivo')` (línea
~36), con `MetodoPago = 'efectivo' | 'transferencia'` definido en
`frontend/src/api/types.ts`. `metodoPago.value` se usa en `onConfirmarVenta`
(línea ~103, `metodo_pago: metodoPago.value` del payload) y se resetea a
`'efectivo'` en `resetVentaForm` (línea ~78).

Incluye:

1. Reemplazar los dos `<label class="metodo-option"><input type="radio">...</label>`
   por dos `<button type="button">` dentro del contenedor `.metodo-pago`, uno por
   cada opción (`efectivo` / `transferencia`), cada uno con su `@click` que asigna
   `metodoPago.value = 'efectivo'` / `'transferencia'` directamente (ya no hay
   `v-model` de radio nativo).
2. Conservar `<IconBanknote />` e `<IconTransfer />` (creados en FE-021) dentro
   del botón correspondiente, junto al texto "Efectivo"/"Transferencia".
3. Accesibilidad de grupo de opciones sin usar `<input type="radio">` nativo:
   - Contenedor `.metodo-pago` con `role="radiogroup"` y un `aria-label`
     descriptivo (ej. `"Método de pago"`), ya que el `<label>` visible de arriba
     (`<label>Método de pago</label>`) deja de estar enlazado nativamente a un
     `<input>` (no había `id`/`for` previamente tampoco, así que no se pierde
     ninguna asociación existente).
   - Cada `<button>` con `role="radio"` y `:aria-checked="metodoPago === 'efectivo'"`
     (o `'transferencia'` según corresponda), reflejando el estado seleccionado.
   - Operable por teclado: al ser `<button>` nativo, Enter/Espacio ya disparan el
     `click` sin trabajo adicional; no es obligatorio implementar navegación con
     flechas de izquierda/derecha típica de `radiogroup` (documentar en notas si
     se decide no implementarla, para que el reviewer no lo marque como pendiente
     sin contexto).
4. Estilo "segmented control" en `.metodo-pago` (ajustar el CSS existente, no
   necesariamente desde cero):
   - Botones del mismo alto, agrupados visualmente (pegados o con separación
     mínima, ej. dentro de un track con `border: 1px solid var(--color-border)` y
     `border-radius: var(--radius-md)`, o dos botones independientes con estética
     de par — a criterio del implementador, siempre que se perciban como un grupo
     único, no como dos controles sueltos).
   - Botón activo (el que coincide con `metodoPago.value`): fondo con gradiente o
     color sólido de acento, consistente con la paleta ya usada en el proyecto
     (ej. mismo gradiente de `.btn-primary` — `linear-gradient(90deg,
     var(--color-purple), var(--color-purple-deep))` — o un acento sólido como
     `var(--color-lime)`/`var(--color-cyan)`, a criterio del implementador,
     documentando la elección en notas).
   - Botón inactivo: fondo transparente o tenue, borde sutil (ej.
     `var(--color-border)` o `var(--color-border-soft)`), texto en
     `var(--color-text)` o `var(--color-text-muted)`.
   - El icono dentro de cada botón sigue heredando `currentColor`; verificar que
     tenga contraste adecuado tanto en el botón activo como en el inactivo (si el
     fondo activo es claro/saturado, puede requerir un color de texto/icono
     distinto al del botón inactivo — a criterio del implementador).
   - Transición simple entre estados (ej. `transition: background 0.15s` o
     similar) es opcional, no obligatoria.
5. `metodoPago` sigue siendo `ref<MetodoPago>('efectivo')`, sin cambiar su tipo,
   su reseteo en `resetVentaForm`, ni el payload de `onConfirmarVenta`.

No incluye:

- Cambiar el tipo `MetodoPago` en `frontend/src/api/types.ts`.
- Tocar `ticket.metodoPago` ni el texto condicional del ticket de confirmación
  (línea ~145, ya resuelto por FE-016).
- Tocar `DashboardView.vue` ni el tag `.tag--transferencia` de la tabla de
  últimas ventas.
- Crear un componente reutilizable nuevo (ej. `SegmentedControl.vue`) — a
  diferencia de `ToggleSwitch.vue` (FE-020), que se reutiliza en formulario y
  tabla de `ProductosView.vue`, este selector solo se usa en un único lugar de
  `VentasView.vue`; extraerlo a un componente aparte queda a criterio del
  implementador pero no es requisito de esta tarea.
- Modificar `IconBanknote.vue` / `IconTransfer.vue` (contenido del SVG) — solo
  se reutilizan tal cual quedaron en FE-021.
- Agregar navegación con flechas de teclado tipo `radiogroup` nativo (ver punto 3
  del alcance) — deseable pero no bloqueante para esta tarea.

## Criterios de aceptación

- [ ] Los dos `<label class="metodo-option"><input type="radio">...</label>`
      fueron reemplazados por dos `<button type="button">` dentro de
      `.metodo-pago`; ya no existe ningún `<input type="radio" name="metodo-pago">`
      en `VentasView.vue`.
- [ ] Al hacer click en el botón "Efectivo", `metodoPago.value` pasa a
      `'efectivo'`; al hacer click en "Transferencia", pasa a `'transferencia'`
      — verificable revisando el handler de cada botón.
- [ ] Solo un botón puede estar "activo" a la vez: el estado visual "activo" del
      botón siempre coincide con `metodoPago.value` (mutuamente excluyentes, sin
      estado intermedio donde ambos o ninguno se vean seleccionados).
- [ ] `<IconBanknote />` sigue dentro del botón "Efectivo" e `<IconTransfer />`
      dentro del botón "Transferencia", junto al texto correspondiente, en ambos
      estados (activo e inactivo).
- [ ] El contenedor `.metodo-pago` tiene `role="radiogroup"` con un `aria-label`
      descriptivo; cada `<button>` tiene `role="radio"` y `aria-checked` que
      refleja correctamente si esa opción es la seleccionada (`"true"` para la
      activa, `"false"` para la otra) — verificable inspeccionando el HTML
      renderizado al cambiar de opción.
- [ ] Ambos botones son operables con teclado: tabular hasta un botón y
      presionar Enter o Espacio cambia `metodoPago.value` al valor de ese botón
      (comportamiento nativo de `<button>`, sin JS adicional requerido para
      esto).
- [ ] Visualmente, el botón correspondiente a `metodoPago.value` actual se
      distingue con claridad del inactivo (fondo de acento vs. fondo
      transparente/tenue con borde sutil) — verificable visualmente en
      `npm run dev`, sin ambigüedad sobre cuál está seleccionado.
- [ ] El icono y el texto dentro de cada botón mantienen contraste legible
      tanto en el botón activo como en el inactivo.
- [ ] Al enviar una venta, el payload de `onConfirmarVenta` sigue incluyendo
      `metodo_pago: metodoPago.value` con el valor correcto según el botón
      seleccionado al momento de confirmar (probar ambos casos: confirmar con
      "Efectivo" activo y con "Transferencia" activo).
- [ ] `resetVentaForm` sigue dejando `metodoPago.value` en `'efectivo'` después
      de registrar una venta (y por tanto el botón "Efectivo" queda visualmente
      activo de nuevo).
- [ ] El tipo `MetodoPago` en `frontend/src/api/types.ts` no fue modificado.
- [ ] `ticket.metodoPago`, el texto condicional del ticket de confirmación
      (línea ~145) y `DashboardView.vue` no fueron modificados por esta tarea.
- [ ] `IconBanknote.vue` e `IconTransfer.vue` no fueron modificados (se
      reutilizan tal cual).
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Archivo tocado: `frontend/src/views/VentasView.vue` (único archivo modificado).
- Los dos `<label class="metodo-option"><input type="radio">…</label>` se
  reemplazaron por dos `<button type="button" class="metodo-option">` dentro de
  `.metodo-pago`. Cada botón tiene `@click` que asigna `metodoPago.value`
  directamente (`'efectivo'` / `'transferencia'`); ya no hay `v-model` ni
  `<input type="radio">` en el archivo (verificado con grep).
- Accesibilidad: `.metodo-pago` tiene `role="radiogroup"` y
  `aria-label="Método de pago"`. Cada botón tiene `role="radio"` y
  `:aria-checked="metodoPago === '<valor>'"`. No se implementó navegación con
  flechas izquierda/derecha (mencionado como no bloqueante en el alcance); al
  ser `<button>` nativo, Tab + Enter/Espacio ya funcionan sin JS adicional.
- El estado "activo" se controla con la clase `.metodo-option--active`
  (aplicada vía `:class` en función de `metodoPago === '<valor>'`), lo cual
  garantiza selección mutuamente excluyente ya que ambos comparan contra el
  mismo `ref`.
- Estilo segmented control: contenedor `.metodo-pago` ahora es un "track" con
  `border: 1px solid var(--color-border)`, `border-radius: var(--radius-md)`,
  fondo `var(--color-bg)` y `padding: 4px` con `gap: 4px` entre los dos
  botones (que ocupan `flex: 1` cada uno, mismo alto). El botón activo usa el
  mismo gradiente de `.btn-primary`/`.btn-agregar`
  (`linear-gradient(90deg, var(--color-purple), var(--color-purple-deep))`)
  con texto/icono en `#fff` (currentColor hereda a los iconos SVG) para
  mantener consistencia visual con el resto del proyecto y buen contraste
  sobre el púrpura saturado. El botón inactivo usa fondo transparente y texto
  `var(--color-text-muted)`, con `:hover` que sube el color a `var(--color-text)`
  para dar feedback sin confundirse con el estado activo. Se agregó
  `transition: background 0.15s ease, color 0.15s ease` (opcional según la
  tarea, pero se incluyó por consistencia con `ToggleSwitch.vue`) y un
  `:focus-visible` con outline `var(--color-cyan)` para paridad de accesibilidad
  con otros controles del proyecto (ToggleSwitch usa el mismo patrón).
- No se creó un componente `SegmentedControl.vue` (fuera de alcance, ya que
  este selector solo se usa en `VentasView.vue`).
- No se tocó `MetodoPago` en `frontend/src/api/types.ts`, ni
  `ticket.metodoPago`/texto condicional del ticket, ni `DashboardView.vue`, ni
  `IconBanknote.vue`/`IconTransfer.vue`.
- `metodoPago` sigue siendo `ref<MetodoPago>('efectivo')`; su uso en
  `resetVentaForm` (reset a `'efectivo'`) y en el payload de
  `onConfirmarVenta` (`metodo_pago: metodoPago.value`) no se modificó.
- Verificación: `npx vue-tsc -b` sin errores, `npm run build`
  (que incluye `vue-tsc -b && vite build`) completado sin errores.
- Prueba manual sugerida: `npm run dev`, ir a Ventas, click en "Efectivo" y
  "Transferencia" para confirmar que solo uno queda resaltado con el gradiente
  púrpura a la vez, inspeccionar el DOM para ver `aria-checked` alternando, y
  confirmar una venta con cada método para verificar el payload y el
  `ticket.metodoPago` resultante, y que tras registrar la venta el selector
  vuelve a "Efectivo".

## Revisión

**Veredicto: done**

Revisión de código en `frontend/src/views/VentasView.vue` (líneas 225-251,
CSS en 468-506) y verificación cruzada de archivos fuera de alcance.

Verificado:

- No queda ningún `<input type="radio">` ni `v-model="metodoPago"` en el
  archivo (confirmado por lectura completa y grep). Los dos `<button
  type="button" class="metodo-option">` están dentro de `.metodo-pago`, cada
  uno con `@click` que asigna `metodoPago.value` directamente al literal
  correspondiente.
- `.metodo-pago` tiene `role="radiogroup"` y `aria-label="Método de pago"`;
  cada botón tiene `role="radio"` y `:aria-checked="metodoPago === '<valor>'"`.
  Vue serializa el booleano como el string `"true"/"false"` en el atributo
  `aria-checked` (no es un boolean-attr especial de Vue, así que no se
  elimina el atributo en `false`), por lo que ambos estados quedan reflejados
  correctamente en el DOM.
- Selección mutuamente excluyente garantizada por construcción: ambas
  condiciones (`--active` y `aria-checked`) comparan contra el mismo `ref`
  `metodoPago`, sin estado intermedio posible.
- Botones nativos `<button>`: operables con Tab + Enter/Espacio sin JS
  adicional, como documentan las notas. La ausencia de navegación con
  flechas se documentó explícitamente y estaba marcada como no bloqueante en
  el alcance.
- `<IconBanknote />` e `<IconTransfer />` se conservan sin modificar dentro
  de cada botón junto al texto; no se tocó el contenido de
  `IconBanknote.vue`/`IconTransfer.vue` (mismo timestamp que dejó FE-021, sin
  diferencias).
- Estilo segmented control: track con borde, radio y fondo (`.metodo-pago`),
  botones `flex: 1` de igual alto, activo con gradiente
  `linear-gradient(90deg, var(--color-purple), var(--color-purple-deep))` y
  texto `#fff` (buen contraste sobre el púrpura saturado), inactivo con fondo
  transparente y `var(--color-text-muted)` con hover a `var(--color-text)`.
  `:focus-visible` con outline cian, consistente con `ToggleSwitch.vue`.
- `onConfirmarVenta` sigue enviando `metodo_pago: metodoPago.value` (línea
  103) sin cambios; `resetVentaForm` sigue reseteando a `'efectivo'` (línea
  78).
- Fuera de alcance no tocado, confirmado por timestamps de archivo y `git
  diff`: `MetodoPago` en `api/types.ts` (última modificación previa a esta
  tarea, tipo intacto `'efectivo' | 'transferencia'`), `ticket.metodoPago` y
  el texto condicional del ticket (línea 145, sin cambios), `DashboardView.vue`
  y su `.tag--transferencia` (sin referencias a `metodo-option`, última
  modificación anterior a FE-022), `IconBanknote.vue`/`IconTransfer.vue` (sin
  diff, timestamp de FE-021).
- `npx vue-tsc -b` sin errores; `npm run build` completa sin errores
  (incluye `vue-tsc -b && vite build`).

No se encontraron hallazgos. Todos los criterios de aceptación se cumplen.
