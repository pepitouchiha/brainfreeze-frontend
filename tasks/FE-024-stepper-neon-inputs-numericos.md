---
id: FE-024
title: "Reemplazar spinners nativos de <input type=\"number\"> por stepper custom neón"
area: frontend
status: done
priority: low
depends_on: []
created_by: planner
---

## Objetivo

El usuario pidió que las flechas nativas de subir/bajar de los `<input type="number">`
(los "spinners" del navegador) se vean más estéticas, en color **neón** acorde a la
paleta del proyecto, manteniendo el fondo del input tal como está hoy.

**Restricción técnica que define el diseño de esta tarea**: los spinners nativos de
`<input type="number">` no se pueden recolorear de forma confiable con CSS — los
navegadores los dibujan con sus propios gráficos internos (motor nativo, fuera del
DOM estilizable). Lo único que CSS permite de forma consistente es **ocultarlos**
(`-webkit-appearance: none` en WebKit/Blink, `-moz-appearance: textfield` en Firefox),
no darles un color custom real; trucos como `filter: invert()`/`hue-rotate()` sobre el
spinner nativo son inconsistentes entre navegadores (Firefox ni siquiera expone esa
pseudo-superficie igual que Chrome) y no producen un "neón" real y confiable.

Por lo tanto la única forma de cumplir el pedido es **ocultar los spinners nativos y
construir un stepper propio** (dos botones ↑/↓ dibujados en SVG, mismo patrón de
`IconPencil.vue`/`IconTrash.vue`/`IconBanknote.vue`/`IconTransfer.vue`), exactamente
el mismo enfoque que ya se usó en FE-020 (`ToggleSwitch.vue`) para reemplazar un
`<select>` nativo poco versátil por un componente propio.

## Alcance

Incluye:

1. **Dos iconos nuevos** en `frontend/src/components/icons/`:
   - `IconChevronUp.vue` y `IconChevronDown.vue`, mismo patrón SVG que los iconos
     existentes de esa carpeta (`viewBox="0 0 24 24"`, `stroke="currentColor"`,
     `aria-hidden="true"`, `focusable="false"`, tamaño por defecto ~16px vía clase
     scoped) — así heredan el color vía `currentColor` desde el botón que los
     contenga, sin hardcodear el color dentro del SVG.

2. **Componente reutilizable `frontend/src/components/common/NumberInput.vue`**
   (sin librerías externas, mismo criterio de "component from scratch" que
   `ToggleSwitch.vue`/`BaseModal.vue`):
   - Prop `modelValue: number | ''` (controlado, `v-model`), emite
     `update:modelValue` con `number | ''` — este contrato calza directo con
     `form.precio` y `form.stock_minimo` (ambos ya tipados `number | ''` en sus
     respectivos `reactive(...)`), **sin** necesitar el modificador `.number` en el
     consumidor porque el propio componente ya emite `number` (o `''` si el campo
     queda vacío).
   - Props equivalentes a los atributos nativos hoy usados en los 3 sitios: `min?:
     number`, `max?: number`, `step?: number | 'any'`, `disabled?: boolean`,
     `placeholder?: string`, `id?: string` (para conservar el `<label for="...">`
     existente sin tocar su markup, igual que `ToggleSwitch` hizo con
     `id="prod-estado"`).
   - Internamente: un `<input type="number">` real (conserva validación/teclado
     nativo de número) con los spinners nativos ocultados vía
     `-webkit-appearance: none` + `margin: 0` en
     `::-webkit-outer-spin-button`/`::-webkit-inner-spin-button`, y
     `-moz-appearance: textfield` para Firefox. El input debe mantener
     exactamente el mismo `background: var(--color-bg); border: 1px solid
     var(--color-border); border-radius: var(--radius-sm); padding: 10px 12px;
     font-size: 14px; color: var(--color-text);` que hoy usa `.form-row input` en
     `ProductosView.vue`/`InventarioView.vue` (copiar esos valores literales, no
     inventar unos nuevos) — el usuario pidió explícitamente que el fondo del
     input no cambie.
   - Dos botones custom `<button type="button">` (criterio de diseño libre del
     implementador: apilados ↑ arriba / ↓ abajo superpuestos al borde derecho del
     input, o adyacentes al lado — lo que se vea mejor con el estilo del proyecto),
     cada uno con su icono (`IconChevronUp`/`IconChevronDown`) coloreado con
     `var(--color-cyan)` (acento neón ya usado en el proyecto para foco/interacción,
     ej. `.toggle-switch:focus-visible` en `ToggleSwitch.vue`) — no introducir un
     color nuevo fuera de `tokens.css`.
   - Al hacer click en ↑/↓: incrementa/decrementa el valor actual por `step` (por
     defecto `1` si no se pasa `step`, coherente con el comportamiento nativo de
     `<input type="number">`), respetando `min`/`max` (clamp, nunca sale del
     rango). Si el valor actual es `''` (vacío), click en ↑ debe partir desde `min`
     si está definido, o desde `0` si no hay `min` (definir explícitamente este
     caso, hoy es ambiguo con el input nativo).
   - Botón "bajar" con `disabled` visual y funcional cuando el valor ya está en
     `min` (o en `''`/no aplica si no hay `min` definido); igual para "subir" en
     `max` si está definido.
   - Accesibilidad, mismo patrón que `ToggleSwitch.vue`: botones nativos
     `<button type="button">` (operables por teclado sin trabajo extra), cada uno
     con `aria-label` distintivo ("Aumentar" / "Disminuir", o más específico si el
     implementador lo prefiere), foco visible vía `outline: 2px solid
     var(--color-cyan)` en `:focus-visible` (mismo criterio que
     `.toggle-switch:focus-visible`). El `<label for="...">` externo sigue
     apuntando al `id` del `<input>` interno (vía la prop `id`), igual que hoy.
   - El usuario sigue pudiendo escribir el número directamente con el teclado en
     el input (no solo con los botones) — esa vía nativa no se pierde, solo se le
     quita el spinner visual feo.

3. **Reemplazar los 3 usos existentes** por `<NumberInput>`:
   - `ProductosView.vue` (~línea 279-287): campo "Precio (COP)",
     `v-model.number="form.precio"` → `v-model="form.precio"` con
     `<NumberInput id="prod-precio" min="1" step="1" placeholder="Ej. 5000"
     :disabled="isSaving" />` (quitar el `.number` del `v-model`, ya no aplica
     porque el componente emite `number` directamente).
   - `InventarioView.vue` (~línea 204-212): campo "Stock mínimo",
     `v-model.number="form.stock_minimo"` → mismo tratamiento, con `min="0"
     step="any"`.
   - `InventarioView.vue` (~línea 293-301): campo "Cantidad" del panel "Ajustar
     stock", `v-model="ajusteCantidad[insumo.id]"` con `min="0" step="any"`. Este
     caso es distinto a los otros dos: hoy `ajusteCantidad` es
     `reactive<Record<number, string>>({})` (string plano, sin `.number`), y
     `onAjustar` (línea ~147-153) hace `Number(crudo)` + valida
     `!crudo || Number.isNaN(valor) || valor <= 0`. Como el nuevo `NumberInput`
     siempre trabaja con `number | ''` (no `string`), hay que decidir una de estas
     dos rutas y dejar constancia en "Notas de implementación" de cuál se tomó:
     - (a) cambiar `ajusteCantidad` a `reactive<Record<number, number | ''>>({})`
       para que calce con el contrato del componente, ajustando `onAjustar` para
       que siga funcionando igual (`!crudo` sigue siendo `true` tanto para `''`
       como para `0`, así que la validación de "cantidad mayor a 0" no cambia de
       comportamiento); o
     - (b) mantener `ajusteCantidad` como `string` y hacer que `NumberInput`
       acepte también `string` vía un tipo de prop más laxo.
     Se prefiere la opción (a) por consistencia con los otros dos usos y porque
     evita tener dos contratos distintos en el mismo componente — pero queda a
     criterio final del implementador si encuentra un impedimento concreto.

No incluye:

- Ningún otro `<input>` del proyecto que no sea `type="number"` (los `<select>`,
  `<input type="text">`, `<input type="file"]`, etc. no se tocan).
- Cambios de layout/spacing de los `.form-row` que contienen estos campos, más
  allá del espacio que ocupen los botones del stepper dentro/junto al input.
- Cambios al backend: esto es puramente visual/de interacción en frontend, no
  afecta ningún payload ni endpoint.
- Un componente de "input numérico con formato de moneda" (separadores de miles,
  etc.) para el campo Precio — fuera de alcance, no lo pidió el usuario.

## Criterios de aceptación

- [ ] Existen `frontend/src/components/icons/IconChevronUp.vue` e
      `IconChevronDown.vue`, mismo patrón que los iconos existentes de esa
      carpeta (SVG con `stroke="currentColor"`, `aria-hidden="true"`,
      `focusable="false"`).
- [ ] Existe `frontend/src/components/common/NumberInput.vue`: componente
      controlado con `v-model` sobre `modelValue: number | ''`, props `min?`,
      `max?`, `step?`, `disabled?`, `placeholder?`, `id?`. No usa ninguna
      librería externa.
- [ ] El `<input>` interno tiene los spinners nativos ocultados en Chrome/Edge
      (`::-webkit-outer-spin-button`/`::-webkit-inner-spin-button` con
      `-webkit-appearance: none; margin: 0;`) y en Firefox
      (`-moz-appearance: textfield` en el propio `input[type='number']`) —
      verificable visualmente en ambos navegadores si están disponibles, o al
      menos revisando que ambas reglas CSS estén presentes.
- [ ] El fondo/borde/radio/padding/tamaño de fuente del `<input>` interno son
      idénticos a los que hoy tiene `.form-row input` (mismos valores literales:
      `background: var(--color-bg)`, `border: 1px solid var(--color-border)`,
      `border-radius: var(--radius-sm)`, `padding: 10px 12px`, `font-size: 14px`,
      `color: var(--color-text)`) — comparación visual antes/después en los 3
      sitios no debe mostrar ningún cambio de fondo.
- [ ] Los dos botones del stepper usan `var(--color-cyan)` para el color de sus
      iconos (vía `currentColor` heredado o `color` explícito en el botón), sin
      introducir ningún color fuera de `tokens.css`.
- [ ] Click en el botón "subir" incrementa el valor actual por `step` (o por `1`
      si no se pasa `step`), sin exceder `max` si está definido; click repetido
      en el límite mantiene el valor en `max` sin pasarse.
- [ ] Click en el botón "bajar" decrementa por `step`, sin bajar de `min` si está
      definido; en `min` el botón queda visualmente deshabilitado
      (`disabled`) y no dispara más decrementos.
- [ ] Con el valor en `''` (vacío), click en "subir" produce `min` si `min` está
      definido, o `0` si no — comportamiento verificado explícitamente en los 3
      sitios donde se usa (los 3 tienen `min` definido: `1`, `0`, `0`
      respectivamente).
- [ ] El usuario puede seguir escribiendo el número directamente por teclado en
      el input (no solo a través de los botones del stepper).
- [ ] Los botones del stepper son `<button type="button">` con `aria-label`
      distintivo cada uno, operables con Enter/Espacio al tener foco (nativo del
      `<button>`), y con `outline: 2px solid var(--color-cyan)` en
      `:focus-visible`.
- [ ] `ProductosView.vue`: el campo "Precio (COP)" usa `<NumberInput
      id="prod-precio" v-model="form.precio" min="1" step="1"
      placeholder="Ej. 5000" :disabled="isSaving" />`; `form.precio` conserva su
      tipo `number | ''` sin cambios; `onSubmit`/la validación existente
      (`form.precio === '' || Number(form.precio) <= 0`) no fue modificada y
      sigue funcionando igual (crear/editar producto con precio válido/inválido
      se comporta exactamente igual que antes).
- [ ] `InventarioView.vue`: el campo "Stock mínimo" usa `<NumberInput
      id="insumo-minimo" v-model="form.stock_minimo" min="0" step="any"
      placeholder="Ej. 5" :disabled="isSaving" />`; `form.stock_minimo` conserva
      su tipo `number | ''`; la validación existente
      (`form.stock_minimo === '' || Number(form.stock_minimo) < 0`) no fue
      modificada y sigue funcionando igual, incluyendo el caso de valores
      decimales (`step="any"` permite ej. `2.5`).
- [ ] `InventarioView.vue`: el campo "Cantidad" del panel "Ajustar stock" usa
      `<NumberInput :id="`ajuste-cantidad-${insumo.id}`" min="0" step="any"
      placeholder="Ej. 10" :disabled="ajustandoId === insumo.id" />` ligado a
      `ajusteCantidad[insumo.id]`; `onAjustar` sigue validando correctamente
      "Ingresa una cantidad mayor a 0" tanto para el campo vacío como para `0`
      (verificar ambos casos manualmente tras el cambio de tipo si se tomó la
      ruta (a) de la sección de Alcance), y `ajustarStock(insumo.id, valor *
      signo)` sigue recibiendo el mismo valor numérico que antes para +Entrada y
      −Salida.
- [ ] Ningún handler existente (`onSubmit` de ambos formularios, `onAjustar`,
      `openEditForm`) fue modificado en su lógica más allá de lo estrictamente
      necesario para adaptar el tipo de `ajusteCantidad` si se tomó la ruta (a).
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

**Archivos creados:**
- `frontend/src/components/icons/IconChevronUp.vue` / `IconChevronDown.vue`: mismo
  patrón SVG que `IconPencil.vue`/`IconTransfer.vue` (`viewBox="0 0 24 24"`,
  `stroke="currentColor"`, `stroke-width="2"`, `aria-hidden`, `focusable="false"`,
  16px por defecto vía clase scoped `.icon-chevron-up`/`.icon-chevron-down`).
- `frontend/src/components/common/NumberInput.vue`: componente controlado,
  `v-model` sobre `modelValue: number | ''`, emite `update:modelValue` con
  `number | ''`. Sin librerías externas.

**Archivos tocados:**
- `frontend/src/views/ProductosView.vue`: campo "Precio (COP)" ahora usa
  `<NumberInput id="prod-precio" v-model="form.precio" :min="1" :step="1" .../>`
  en lugar de `<input type="number" v-model.number>`.
- `frontend/src/views/InventarioView.vue`: campo "Stock mínimo" (`<NumberInput
  id="insumo-minimo" ... :min="0" step="any" />`) y campo "Cantidad" del panel
  "Ajustar stock" (`<NumberInput :id="`ajuste-cantidad-${insumo.id}`" :min="0"
  step="any" />`) reemplazados de la misma forma. Se quitó la regla CSS
  `.ajuste-box input { width: 120px; background: ...; padding: 8px 10px; ... }`
  (ya no aplica, el selector `input` ya no matchea el nuevo wrapper) y se
  reemplazó por `.ajuste-box :deep(.number-input) { width: 160px; }` para
  conservar el mismo tamaño compacto junto a los botones "+ Entrada"/"− Salida"
  (el resto de fondo/borde/radio/padding/font-size ahora vive dentro de
  `NumberInput.vue`, con los valores literales exactos de `.form-row input`).

**Decisión sobre `ajusteCantidad` (string vs number):** se tomó la ruta (a)
sugerida por la tarea: `ajusteCantidad` pasó de
`reactive<Record<number, string>>({})` a
`reactive<Record<number, number | ''>>({})` para calzar directo con el
contrato `number | ''` de `NumberInput`. `onAjustar` no requirió cambios de
lógica: `Number(crudo)` y `!crudo` siguen funcionando igual con `crudo:
number | ''` (Number(0) === 0, Number('') === 0, `!0` y `!''` ambos `true`),
así que la validación "Ingresa una cantidad mayor a 0" se comporta
exactamente igual para el campo vacío y para `0`. `toggleAjuste` ya
inicializaba `ajusteCantidad[insumo.id] = ''`, que sigue siendo válido con el
nuevo tipo.

**Diseño del stepper:** se optó por el layout "adyacente al lado" (no
superpuesto dentro del input) mencionado como alternativa válida en el
alcance de la tarea, en vez de superponer los botones sobre el borde derecho
del input. La razón: la tarea exige que el `<input>` interno conserve
`padding: 10px 12px` **idéntico y literal** a `.form-row input`; superponer
botones dentro del input hubiera requerido robarle padding-right (rompiendo
ese criterio). Con el layout adyacente, el input mantiene su caja intacta
(fondo/borde/radio/padding/font-size sin ninguna modificación) y los dos
botones (↑ arriba, ↓ abajo, apilados) viven en una columna de 26px de ancho
a su derecha, con su propio borde `1px solid var(--color-border)` y radio
`var(--radius-sm)`, separados por `gap: 6px`. El wrapper raíz `.number-input`
usa `display:flex; align-items:stretch; width:100%`, así que en los 2
formularios principales (`.form-row`, flex-column) sigue ocupando el ancho
completo de la fila igual que el `<input>` nativo antes; en el panel de
"Ajustar stock" (`.ajuste-box`, flex-row) se fijó el ancho vía `:deep()` como
se explicó arriba.

**Manejo del caso "valor vacío + click en subir/bajar":** al hacer click en
↑ con el valor en `''`, el nuevo valor es `min` si está definido o `0` si no
(tal como pide la tarea explícitamente). Para el botón ↓ desde `''` se
implementó el mismo comportamiento simétrico (parte desde `min`/`0`, no
resta `step` en ese primer click) — la tarea no define este caso de forma
explícita para "bajar", solo aclara cuándo debe quedar deshabilitado
("cuando el valor ya está en `min`, o no aplica si no hay `min` definido").
Se interpretó que el botón "bajar" **solo** se deshabilita cuando hay un
`min` definido y el valor numérico actual es `<= min`; si no hay `min`
definido, el botón nunca se deshabilita (permite decrementar libremente,
incluso a negativos), y con el valor en `''` el botón nunca aparece
deshabilitado (se habilita para poder fijar el valor de partida). Esta
lectura es la más consistente con la semántica de "subir" ya definida en la
tarea y evita un estado donde el botón "bajar" quede permanentemente inerte
en campos sin `min` (los 3 usos reales sí tienen `min` definido: `1`, `0`,
`0`, así que este matiz no afecta el comportamiento observable en la app
actual, solo queda documentado por si surge un futuro `NumberInput` sin
`min`).

**Cantidad de paso (`step`) para los botones del stepper:** cuando `step`
no se pasa, o se pasa como `'any'` (caso de "Stock mínimo" y "Cantidad" en
Inventario), los botones incrementan/decrementan de a `1` — `'any'` en HTML
solo relaja la validación nativa de decimales al escribir con teclado, pero
no define una magnitud de paso utilizable por un botón, así que se usó `1`
como valor razonable por defecto (mismo criterio que "si no se pasa `step`,
usar `1`" que ya pide la tarea).

**Cómo probarlo manualmente:**
1. `npm run dev` (ya corriendo en `http://localhost:5173`), iniciar sesión
   con `admin@brainfreeze.com` / `Admin1234`.
2. Ir a **Productos** → "+ Nuevo producto": el campo "Precio (COP)" ya no
   muestra las flechas nativas del navegador; a la derecha aparecen dos
   botones cian (↑/↓). Con el campo vacío, click en ↑ pone `1` (su `min`);
   clicks sucesivos suman de a `1`; el botón ↓ se deshabilita en `1`.
3. Ir a **Inventario** → "+ Nuevo insumo": campo "Stock mínimo" con `min="0"`,
   mismo comportamiento (vacío + ↑ → `0`; ↓ deshabilitado en `0`); se puede
   seguir escribiendo decimales por teclado (`step="any"`), p. ej. `2.5`.
4. En la tabla de Inventario, click en "Ajustar stock" de cualquier insumo:
   el campo "Cantidad" usa el mismo stepper; "Ingresa una cantidad mayor a 0"
   sigue apareciendo tanto con el campo vacío como escribiendo `0`; "+ Entrada"
   / "− Salida" siguen aplicando el signo correcto al valor ingresado.
5. Verificar visualmente que el fondo/borde de los 3 inputs no cambió
   respecto a antes (mismo `--color-bg`, `--color-border`, `--radius-sm`).
6. `npx vue-tsc -b` y `npx vite build` corridos sin errores.

## Revisión

**Veredicto: done**

Revisé `NumberInput.vue`, `IconChevronUp.vue`/`IconChevronDown.vue`, y los 3 usos
en `ProductosView.vue`/`InventarioView.vue`, además de correr `npx vue-tsc -b`
y `npx vite build` (ambos sin errores).

Verificaciones puntuales:
- Iconos: mismo patrón exacto que `IconPencil.vue` (`viewBox`, `stroke="currentColor"`,
  `aria-hidden="true"`, `focusable="false"`, 16px por defecto vía clase scoped).
- `NumberInput.vue`: contrato `modelValue: number | ''` con `v-model`, props
  `min?/max?/step?/disabled?/placeholder?/id?`, sin librerías externas. Spinners
  nativos ocultos con `::-webkit-outer/inner-spin-button { -webkit-appearance: none; margin: 0 }`
  y `-moz-appearance: textfield`. El input interno conserva literalmente
  `background/border/border-radius/padding/font-size/color` de `.form-row input`.
  Botones del stepper usan `var(--color-cyan)`, `outline: 2px solid var(--color-cyan)`
  en `:focus-visible`, `aria-label="Aumentar"/"Disminuir"`, `<button type="button">`
  con `disabled` real (no solo visual) en los límites — confirmado que no queda
  ningún color fuera de `tokens.css` (`--color-bg`, `--color-border`, `--radius-sm`,
  `--color-cyan` todos definidos en `src/assets/styles/tokens.css`).
- Lógica de `increment`/`decrement`: clamp correcto a `min`/`max`, `stepAmount`
  resuelve `'any'`/`undefined` a `1` (decisión razonable y documentada, ya que
  `step="any"` no define una magnitud utilizable por botones). Caso `''` + click
  en "subir" → `min` si está definido o `0` si no, tal como pide la tarea; el
  caso simétrico para "bajar" desde `''` no está definido por la tarea y quedó
  documentado con una interpretación consistente en "Notas de implementación".
- `ProductosView.vue`: `<NumberInput id="prod-precio" v-model="form.precio" :min="1" :step="1" .../>`
  coincide exactamente con lo pedido; `onSubmit`/`openEditForm` sin cambios.
- `InventarioView.vue`: `<NumberInput id="insumo-minimo" ... :min="0" step="any" />`
  para "Stock mínimo" sin cambios en `onSubmit`. Para "Cantidad" del panel
  "Ajustar stock", `ajusteCantidad` pasó a `reactive<Record<number, number | ''>>({})`
  (ruta (a) sugerida por la tarea); revisé `onAjustar` línea por línea:
  `Number(crudo)` y `!crudo` siguen comportándose igual para `''` y para `0`
  (`!0 === true`, `!'' === true`), así que la validación "Ingresa una cantidad
  mayor a 0" no cambió de comportamiento. `toggleAjuste` sigue inicializando
  `ajusteCantidad[insumo.id] = ''`, válido con el nuevo tipo.
- CSS muerta: confirmé que no quedó ninguna regla `input[type='number']` ni la
  vieja `.ajuste-box input { width: 120px; ... }` — fue reemplazada limpiamente
  por `.ajuste-box :deep(.number-input) { width: 160px; }`.
- `git status` en el repo del frontend confirma que no se tocó ningún archivo
  fuera del alcance declarado (icons nuevos, `NumberInput.vue` nuevo,
  `ProductosView.vue`/`InventarioView.vue` modificados; sin scope creep).
- `npx vue-tsc -b`: sin errores. `npx vite build`: build exitoso (genera
  `dist/assets/NumberInput-*.{js,css}` como chunk propio).

No se encontraron hallazgos que requieran cambios. Las decisiones de diseño
documentadas (layout adyacente en vez de superpuesto, paso de stepper fijo en
`1` para `step="any"`, comportamiento de "bajar" desde `''`) están justificadas
y no contradicen ningún criterio de aceptación explícito.
