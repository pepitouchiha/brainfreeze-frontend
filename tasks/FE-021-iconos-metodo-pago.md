---
id: FE-021
title: Iconos SVG (billete/transferencia) en selector de método de pago del POS
area: frontend
status: done
priority: low
depends_on: []
created_by: planner
---

## Objetivo

Agregar un icono junto a cada opción del selector "Método de pago" del
carrito en `VentasView.vue` (POS): un icono de billete/efectivo para
"Efectivo" y un icono de transferencia (flechas intercambiando o icono
típico de transferencia bancaria) para "Transferencia". Sigue el mismo
patrón ya establecido en FE-018 (`IconPencil.vue`/`IconTrash.vue`) y en
`frontend/src/components/layout/AppSidebar.vue`: SVG inline dibujado a
mano (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`), sin
librerías de iconos de terceros.

## Alcance

Verificado por lectura de código en `frontend/src/views/VentasView.vue`
(líneas ~223-235):

```html
<div class="form-row">
  <label>Método de pago</label>
  <div class="metodo-pago">
    <label class="metodo-option">
      <input v-model="metodoPago" type="radio" name="metodo-pago" value="efectivo" />
      Efectivo
    </label>
    <label class="metodo-option">
      <input v-model="metodoPago" type="radio" name="metodo-pago" value="transferencia" />
      Transferencia
    </label>
  </div>
</div>
```

Incluye:
- Crear dos componentes de icono nuevos en
  `frontend/src/components/icons/` (ej. `IconBanknote.vue` e
  `IconTransfer.vue`, o los nombres que el implementador prefiera,
  manteniendo el prefijo `Icon*` ya usado por `IconPencil.vue`/
  `IconTrash.vue`), siguiendo exactamente el patrón SVG de esos dos
  componentes (`viewBox="0 0 24 24"`, `fill="none"`,
  `stroke="currentColor"`, `stroke-width="1.8"`,
  `stroke-linecap/linejoin="round"`, sin `<script>`, tamaño fijo vía
  `<style scoped>`).
- Insertar cada icono dentro del `<label class="metodo-option">`
  correspondiente (antes o después del texto, a criterio del
  implementador, siempre que quede alineado con el `<input>` y el
  texto), dentro del mismo `<label>` para no romper la asociación
  nativa radio-label.
- Ajustar el CSS de `.metodo-option` (línea ~457-464 de
  `VentasView.vue`) solo lo necesario para alinear verticalmente el
  icono con el texto (ya usa `display: flex; align-items: center; gap:
  6px;`, probablemente sirva sin cambios, pero verificar en pantalla).

No incluye:
- Cambiar el `v-model="metodoPago"`, los `value` de los radios, ni
  ningún handler o lógica de envío del formulario de venta.
- Tocar `ticket.metodoPago` ni el texto condicional del ticket de
  confirmación (fuera de esta tarea, ya resuelto por FE-016).
- Tocar `DashboardView.vue` ni el tag `.tag--transferencia` de la tabla
  de últimas ventas — esta tarea es exclusiva del selector del POS en
  `VentasView.vue`.
- Traer una librería de iconos de terceros (ej. `lucide-vue`,
  `heroicons`) — mismo criterio que FE-018.

## Criterios de aceptación

- [ ] La opción "Efectivo" del selector de método de pago en
      `VentasView.vue` muestra un icono de billete/efectivo (SVG
      inline, sin librería de terceros) junto al texto.
- [ ] La opción "Transferencia" muestra un icono de transferencia
      (flechas intercambiando o icono equivalente reconocible como
      transferencia bancaria, SVG inline) junto al texto.
- [ ] Ambos iconos siguen el mismo patrón visual que
      `IconPencil.vue`/`IconTrash.vue`/`AppSidebar.vue`: `viewBox="0 0
      24 24"`, `fill="none"`, `stroke="currentColor"` (trazos, no
      formas rellenas), tamaño consistente entre sí (ej. 16-18px), y
      alineados verticalmente con el texto de cada opción.
- [ ] El texto "Efectivo"/"Transferencia" sigue siendo visible (esta
      tarea agrega el icono, no reemplaza el texto).
- [ ] Ambos `<svg>` tienen `aria-hidden="true"` (y `focusable="false"`,
      igual que `IconPencil.vue`/`IconTrash.vue`) porque son
      decorativos — el texto visible ya cumple la función de label
      accesible del radio button.
- [ ] El icono queda dentro del mismo `<label class="metodo-option">`
      que envuelve al `<input type="radio">` correspondiente (no en un
      elemento hermano fuera del `<label>`), de forma que hacer click
      en el icono siga marcando esa opción del radio button.
- [ ] El color del icono usa `currentColor` heredado del color de
      texto de `.metodo-option` (`var(--color-text)`) o, a criterio del
      implementador, un acento de la paleta definida en
      `frontend/src/styles/tokens.css` si mejora la legibilidad —
      en cualquier caso, el icono se ve con contraste adecuado tanto
      cuando el radio está seleccionado como cuando no lo está (el
      selector no tiene hoy un estado visual distinto para "checked"
      más allá del propio radio nativo; si el implementador agrega uno,
      debe documentarlo en las notas).
- [ ] Ningún `value` de los radios, el `v-model`, ni ningún handler de
      Vue relacionado con el envío de la venta fue modificado.
- [ ] `DashboardView.vue` y el ticket de confirmación de venta no fueron
      modificados por esta tarea.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Se crearon dos componentes nuevos en `frontend/src/components/icons/`:
  `IconBanknote.vue` (billete con círculo central, óvalos de perforación
  como puntos) e `IconTransfer.vue` (dos flechas horizontales en
  direcciones opuestas, patrón típico de transferencia). Ambos siguen
  exactamente el patrón de `IconPencil.vue`/`IconTrash.vue`:
  `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-width="1.8"`, `stroke-linecap/linejoin="round"`,
  `aria-hidden="true"`, `focusable="false"`, sin `<script>`, tamaño fijo
  16x16px vía `<style scoped>`.
- En `frontend/src/views/VentasView.vue` se importaron ambos componentes
  y se insertó `<IconBanknote />` dentro del `<label class="metodo-option">`
  de "Efectivo" (entre el `<input>` y el texto) e `<IconTransfer />` dentro
  del de "Transferencia", en el mismo `<label>` que envuelve cada
  `<input type="radio">` para no romper la asociación nativa.
- No fue necesario ajustar el CSS de `.metodo-option`: ya tenía
  `display: flex; align-items: center; gap: 6px;`, suficiente para
  alinear verticalmente el icono (16px) con el texto (13.5px).
- El color del icono hereda `currentColor` de `.metodo-option` (que usa
  `var(--color-text)`), igual en ambos estados (checked/unchecked) porque
  el selector no tiene hoy un estado visual distinto para "checked" más
  allá del radio nativo — no se agregó ninguno, tal como indica la tarea.
- No se modificaron `v-model`, `value` de los radios, handlers de envío
  de venta, `DashboardView.vue` ni el ticket de confirmación.
- Verificado: `npx vue-tsc -b` y `npx vite build` corren sin errores.
- Cómo probar manualmente: `npm run dev`, ir a la vista Ventas (POS),
  observar el selector "Método de pago" en el panel del carrito — debe
  mostrar el icono de billete junto a "Efectivo" y el icono de flechas
  junto a "Transferencia", ambos alineados con el texto y el radio.

## Revisión

**Veredicto: done**

Verificación de código (no solo visual):

- `frontend/src/components/icons/IconBanknote.vue` e `IconTransfer.vue`
  siguen exactamente el patrón de `IconPencil.vue`/`IconTrash.vue`:
  `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-width="1.8"`, `stroke-linecap/linejoin="round"`,
  `aria-hidden="true"`, `focusable="false"`, sin `<script>`, tamaño fijo
  16x16px vía `<style scoped>`. Correcto y decorativo (no interfiere con
  lectores de pantalla; el texto visible sigue siendo el label accesible
  del radio).
- En `VentasView.vue` los dos `<IconBanknote />`/`<IconTransfer />` quedan
  insertados dentro del mismo `<label class="metodo-option">` que envuelve
  cada `<input type="radio">` (entre el input y el texto), por lo que el
  click en el icono sigue activando el radio vía la asociación nativa
  label→input. Confirmado leyendo el `<template>` (líneas ~228-237).
- `git diff` de `VentasView.vue` contra el commit inicial (único commit del
  repo) muestra que la contribución específica de esta tarea es exactamente
  2 líneas de `import` y 2 usos `<IconBanknote />`/`<IconTransfer />` — el
  resto del diff acumulado (tarjeta→transferencia, `ProductoThumbnail`)
  corresponde a tareas previas (FE-016/FE-017) ya no distinguibles en
  commits separados, pero no fue tocado por esta tarea.
- No se modificó `v-model="metodoPago"`, ningún `value` de los radios, ni
  handlers de envío de venta.
- `DashboardView.vue`, el ticket de confirmación (`ticket.metodoPago`) y el
  tipo `MetodoPago` en `frontend/src/api/types.ts` no fueron tocados por
  esta tarea (sus diffs frente al commit inicial pertenecen a trabajo
  previo ya documentado en FE-011/FE-016).
- No se agregó librería de iconos de terceros.
- CSS de `.metodo-option` sin cambios, tal como se documentó — el
  `display: flex; align-items: center; gap: 6px` ya existente basta.
- `npx vue-tsc -b`: sin errores. `npx vite build`: build exitoso.

Todos los criterios de aceptación se cumplen. No hay hallazgos.
