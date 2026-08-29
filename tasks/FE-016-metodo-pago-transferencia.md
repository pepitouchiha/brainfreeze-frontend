---
id: FE-016
title: Cambiar método de pago "Tarjeta" por "Transferencia"
area: frontend
status: done
priority: high
depends_on: [BE-009]
created_by: planner
---

## Objetivo

Reflejar en el frontend el cambio de contrato definido en BE-009: el valor
`"tarjeta"` deja de ser un método de pago válido y se reemplaza por
`"transferencia"`. No implementar esta tarea antes de que BE-009 esté
`done` — el tipo `MetodoPago` del frontend debe tipar exactamente contra lo
que el backend ya acepta.

## Alcance

Puntos verificados por lectura de código donde aparece `'tarjeta'`/
`Tarjeta`/`MetodoPago`:

- `frontend/src/api/types.ts` (línea 126): `export type MetodoPago =
  'efectivo' | 'tarjeta'` → cambiar a `'efectivo' | 'transferencia'`.
- `frontend/src/views/VentasView.vue`:
  - Radio button de método de pago (líneas 228-231): `value="tarjeta"` +
    texto "Tarjeta" → `value="transferencia"` + texto "Transferencia".
  - Texto condicional del ticket de confirmación (línea 142):
    `ticket.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'` →
    `... : 'Transferencia'`.
- `frontend/src/views/DashboardView.vue`:
  - Columna "Método de pago" de últimas ventas (línea 94):
    `venta.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta'` →
    `... : 'Transferencia'`.
  - Clase CSS `.tag--tarjeta` (línea ~302) → renombrar a
    `.tag--transferencia` (el binding `:class="`tag--${venta.metodo_pago}`"`
    en línea 93 genera el nombre de clase a partir del valor real de
    `metodo_pago`, así que si no se renombra la clase CSS el tag queda sin
    estilo para ventas con transferencia).
- No es solo un cambio de texto: es un cambio de tipo (`MetodoPago`), así
  que `npx vue-tsc -b` debe fallar temporalmente si queda algún `'tarjeta'`
  suelto sin actualizar — usarlo como verificación adicional.
- No incluye: ninguna lógica nueva de negocio ni cambios a `mesaSeleccionada`
  u otros campos del formulario de venta.

## Criterios de aceptación

- [ ] `MetodoPago` en `frontend/src/api/types.ts` es exactamente
      `'efectivo' | 'transferencia'` (ya no incluye `'tarjeta'`).
- [ ] En `VentasView.vue`, el selector de método de pago del carrito
      muestra "Efectivo" y "Transferencia" (ya no "Tarjeta"), y el valor
      enviado en `POST /ventas` es `"transferencia"`.
- [ ] El ticket de confirmación tras registrar una venta con transferencia
      muestra el texto "Transferencia", no "Tarjeta".
- [ ] En `DashboardView.vue`, las últimas ventas con `metodo_pago:
      "transferencia"` muestran el texto "Transferencia" y el tag tiene
      estilo visual aplicado (no aparece sin color/clase por un selector
      CSS desactualizado).
- [ ] Registrar una venta de punta a punta con `metodo_pago:
      "transferencia"` contra el backend real (BE-009 ya implementado)
      funciona sin errores 422.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores (sin
      referencias residuales a `'tarjeta'` en código TypeScript/Vue de la
      aplicación).

## Notas de implementación

**Archivos modificados:**
- `frontend/src/api/types.ts`: `MetodoPago` cambiado de `'efectivo' | 'tarjeta'` a
  `'efectivo' | 'transferencia'`.
- `frontend/src/views/VentasView.vue`: radio button del selector de método de pago
  (`value="tarjeta"` → `value="transferencia"`, texto "Tarjeta" → "Transferencia") y texto
  condicional del ticket de confirmación (`'Tarjeta'` → `'Transferencia'`).
- `frontend/src/views/DashboardView.vue`: texto condicional de la columna "Método de pago" en
  la tabla de últimas ventas (`'Tarjeta'` → `'Transferencia'`) y clase CSS `.tag--tarjeta`
  renombrada a `.tag--transferencia` (el binding `:class="`tag--${venta.metodo_pago}`"` genera
  el nombre de clase a partir del valor real de `metodo_pago`, así que sin este rename el tag
  quedaba sin estilo).

**Verificación:**
- `grep -ri "tarjeta"` sobre `frontend/src` no devuelve resultados residuales.
- `npx vue-tsc -b` corre sin errores.
- `npx vite build` corre sin errores.
- Prueba end-to-end contra el backend real (puerto 8000, ya corriendo con la DB recreada tras
  BE-009): `POST /ventas` con `{"items":[{"producto_id":1,"cantidad":1}],"metodo_pago":"transferencia"}`
  → `201`, respuesta con `"metodo_pago":"transferencia"`. Esto dejó **una venta de prueba real**
  en la base de datos de desarrollo (no hay endpoint `DELETE /ventas` para revertirla); se
  señala explícitamente porque el entorno se describió como recién recreado sin datos de
  prueba de ventas — quedó 1 fila en la tabla `ventas` como efecto de esta verificación
  end-to-end requerida por el criterio de aceptación.

**Cómo probarlo manualmente:**
1. `npm run dev` (o usar el servidor ya corriendo en `localhost:5173`), iniciar sesión con
   `admin@brainfreeze.com` / `Admin1234`.
2. Ir a Ventas, agregar un producto al carrito, seleccionar "Transferencia" como método de
   pago y confirmar la venta — el ticket debe mostrar "Transferencia" y no debe haber error 422.
3. Ir a Dashboard y confirmar que la venta aparece en "Últimas ventas" con el tag
   "Transferencia" con estilo (color magenta, igual que antes tenía "Tarjeta").

## Revisión

**Veredicto: done**

Verificado por lectura de código y en vivo contra el backend real:

- `frontend/src/api/types.ts`: `MetodoPago = 'efectivo' | 'transferencia'`,
  exacto.
- `VentasView.vue`: radio `value="transferencia"` con texto
  "Transferencia"; ticket de confirmación muestra
  `ticket.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'`.
- `DashboardView.vue`: texto condicional actualizado a "Transferencia" y
  clase `.tag--transferencia` (ya no `.tag--tarjeta`) definida en el
  `<style>`, coincide con el binding
  `:class="`tag--${venta.metodo_pago}`"`.
- `grep -i tarjeta` sobre `frontend/src` no devuelve ningún resultado
  (verificado de nuevo en esta revisión).
- `npx vue-tsc -b` y `npx vite build` corren sin errores.
- Repetí la prueba end-to-end contra el backend real: `POST /ventas` con
  `metodo_pago: "transferencia"` → `201`. Nota: esto (y mi propia
  verificación de BE-011) dejó más filas de prueba en la tabla `ventas` de
  `brainfreeze.db` de desarrollo — no hay endpoint para revertirlas, mismo
  caso ya señalado por esta misma tarea; no es un hallazgo de calidad, solo
  aviso operativo para quien continúe usando este entorno.

Sin hallazgos de código. Cumple los 6 criterios de aceptación.
