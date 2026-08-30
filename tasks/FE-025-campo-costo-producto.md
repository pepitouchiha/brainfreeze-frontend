---
id: FE-025
title: Campo "Costo" en el formulario de producto y margen visible en la tabla
area: frontend
status: done
priority: medium
depends_on: [FE-004, BE-017]
created_by: planner
---

## Objetivo

BE-017 agrega `costo` (precio de compra/producción, opcional) a `Producto`.
Esta tarea expone ese campo en la pantalla de Productos: permite cargarlo al
crear/editar un producto y muestra el margen unitario resultante en la
tabla, para que el dueño empiece a ver de un vistazo qué productos dejan
más o menos ganancia por unidad — sin esperar a los reportes agregados de
FE-026.

## Alcance

- Lee el contrato actualizado de `Producto`/`ProductoCreate`/`ProductoUpdate`
  en `backend/tasks/BE-017-costo-producto.md` (`costo: number | null`,
  opcional, sin negativos).
- `frontend/src/api/types.ts`: agregar `costo: number | null` a `Producto`,
  y `costo?: number | null` a `ProductoCreate`/`ProductoUpdate`, confirmado
  contra el backend real igual que ya se hizo para el resto de campos en
  FE-004.
- Formulario de alta/edición en `ProductosView.vue`: agregar un campo
  numérico "Costo" junto al de "Precio" (mismo tipo de input, mismo patrón
  de validación de no-negativo en el cliente que ya usa `precio`), claramente
  opcional (label o placeholder que indique que puede dejarse vacío, ej.
  "Costo (opcional)"). Al enviar el formulario, si el campo queda vacío
  enviar `costo: null` explícitamente para poder **borrar** un costo ya
  asignado (no omitir la clave), consistente con cómo el backend distingue
  "omitido" de "null explícito" (ver BE-017 / patrón ya usado para
  `sabor`/`tamano`/`imagen_base64`).
- Tabla de productos: agregar una columna "Margen" que muestre `precio -
  costo` formateado con `formatCOP` cuando el producto tiene `costo` no
  nulo, y un indicador claro de "no definido" (ej. `"—"` o `"N/D"`, decisión
  de UI libre, pero no debe mostrarse como `$0` ni como un margen del 100%)
  cuando `costo` es `null`. No se pide gráfico ni porcentaje de margen, solo
  el valor absoluto en COP.
- No incluye: mostrar `costo` en ninguna otra pantalla (POS, ventas), ni
  agregar un endpoint/columna de "costo total de insumos" — eso pertenece a
  un eventual modelo de receta/BOM, explícitamente fuera de alcance según
  documenta BE-017.

## Criterios de aceptación

- [ ] El formulario de crear producto permite dejar "Costo" vacío; el
      producto se crea igual que antes (sin regresión) con `costo: null`.
- [ ] El formulario permite ingresar un costo numérico no negativo; un valor
      negativo se rechaza en el cliente antes de enviar el request (o, como
      mínimo, el error `422` del backend se muestra de forma clara al
      usuario).
- [ ] Editar un producto para asignarle un costo por primera vez lo refleja
      correctamente en la tabla tras guardar.
- [ ] Editar un producto para **borrar** un costo ya asignado (vaciar el
      campo y guardar) efectivamente lo deja en `null` — verificado
      recargando la lista después de guardar, no solo en el estado local
      optimista si lo hubiera.
- [ ] La columna "Margen" de la tabla muestra `precio - costo` formateado en
      COP para productos con costo definido, y un indicador distinto de
      "$0"/vacío para productos sin costo definido.
- [ ] `npx vue-tsc -b` y `npm run build` sin errores de tipos tras agregar
      `costo` a `Producto`/`ProductoCreate`/`ProductoUpdate`.

## Notas de implementación

Contrato de backend confirmado leyendo `backend/tasks/BE-017-costo-producto.md`
(status `done`, verificado en revisión) y `backend/app/schemas/producto.py`
directamente: `ProductoCreate.costo`/`ProductoUpdate.costo:
int | None = Field(default=None, ge=0)`, `ProductoOut.costo: int | None`.
`actualizar_producto` usa `exclude_unset` (`"costo" in campos_enviados`), así
que hay que enviar la clave `costo` explícitamente (con `null` si se vació)
para poder borrarlo, tal como pedía la tarea.

Nota sobre el "patrón ya usado para `sabor`/`tamano`" que menciona el alcance:
al revisar `ProductosView.vue` esos dos campos **no** están implementados en
el formulario todavía (solo existen en `frontend/src/api/types.ts`, sin uso
en la vista) — no hay ningún patrón de UI existente para "borrar explícito"
de esos dos campos que replicar. El único patrón real de "enviar `null`
explícito para borrar" que existe hoy en el archivo es el de `imagen_base64`
(con la bandera `imagenTouched`), pero ese patrón requiere una bandera de
"tocado" porque la imagen no se re-declara en cada submit (para no perder el
valor si el usuario no la toca). Para `costo` no hace falta esa complejidad
porque el campo del formulario siempre refleja el valor actual completo (como
`precio`): se envía la clave `costo` en **todo** submit (create y edit),
convirtiendo `''` a `null` y cualquier otro valor a `Number(...)`. Esto
cumple el criterio de aceptación de borrar un costo existente sin necesitar
una bandera adicional.

**Archivos tocados:**

- `frontend/src/api/types.ts`: agregado `costo: number | null` a `Producto`,
  y `costo?: number | null` a `ProductoCreate`/`ProductoUpdate`.
- `frontend/src/views/ProductosView.vue`:
  - `form.costo: number | ''` (mismo patrón que `form.precio`), inicializado
    en `''` en `openCreateForm` y en `producto.costo ?? ''` en
    `openEditForm`.
  - Nuevo campo "Costo (opcional)" en el formulario, usando el mismo
    componente `NumberInput` que "Precio (COP)", con `:min="0"` (a
    diferencia de `precio` que usa `:min="1"`, porque `costo=0` es válido
    según BE-017).
  - Validación cliente: si `form.costo !== ''` y `Number(form.costo) < 0`,
    error "El costo no puede ser negativo." antes de enviar el request (el
    stepper/min del `NumberInput` ya evita bajar de 0 con los botones, pero
    esta validación cubre tipear un negativo directo en el `<input
    type="number">`).
  - `onSubmit`: el payload siempre incluye `costo: form.costo === '' ? null :
    Number(form.costo)` (a diferencia de `imagen_base64`, que sigue enviando
    `undefined` cuando no fue tocada) — así se garantiza que vaciar el campo
    y guardar deja el costo en `null` explícito tanto al crear como al
    editar.
  - Nueva función `margenFor(producto): number | null` (`null` si
    `producto.costo === null`, si no `precio - costo`).
  - Nueva columna "Margen" en la tabla, entre "Precio" y "Estado": muestra
    `formatCOP(margenFor(producto))` cuando hay costo definido, o un span
    `N/D` (itálica, color muted, con `title="Costo no definido"`) cuando
    `producto.costo === null` — nunca `$0` ni vacío para el caso
    "desconocido".
  - CSS agregado: `.margen` (tabular-nums) y `.margen--sin-definir` (color
    muted, itálica, tamaño reducido), consistentes con el resto de la hoja
    de estilos scoped del archivo (reutiliza tokens existentes, no agrega
    ninguno nuevo).

**Cómo probarlo manualmente:**

1. `cd frontend && npm run dev`, ir a la vista Productos (requiere login).
2. Crear un producto nuevo dejando "Costo" vacío -> se crea sin error, en la
   tabla la columna "Margen" muestra "N/D".
3. Editar ese producto y asignarle un costo (ej. `3000`, con precio `8000`)
   -> tras guardar, la tabla muestra "Margen: $5.000".
4. Editar el mismo producto y borrar el campo "Costo" (dejarlo vacío) ->
   guardar y **recargar la página** (o navegar y volver) para confirmar
   contra el backend real (no solo estado local) que el costo quedó en
   `null` y la columna vuelve a mostrar "N/D".
5. Intentar tipear un costo negativo (ej. `-500`) directamente en el input ->
   al enviar el formulario se muestra "El costo no puede ser negativo." sin
   llegar a golpear el backend.
6. `npx vue-tsc -b` y `npm run build` corridos sin errores (ver notas de
   verificación de esta misma tarea).

**Nota de dependencia:** BE-017 está `done`, pero recordar el caveat
operativo documentado ahí: si el entorno local tiene una `brainfreeze.db`
preexistente sin la columna `costo`, hay que borrarla antes de levantar el
servidor (`uvicorn`) para poder probar este flujo end-to-end contra el
backend real.

## Revisión

**Veredicto: `done`.**

Revisé código y corrí las herramientas de verificación yo mismo (no solo leí
lo reportado):

- `npx vue-tsc -b`: sin salida, sin errores.
- `npm run build` (que internamente corre `vue-tsc -b && vite build`): build
  exitoso, sin warnings de tipos.

Verificación punto por punto de lo pedido en la consigna de revisión:

- **Tipos (`frontend/src/api/types.ts` vs `backend/app/schemas/producto.py`):**
  coinciden exactamente. `Producto.costo: number | null` (líneas 58-69),
  `ProductoCreate.costo?: number | null` (líneas 71-80),
  `ProductoUpdate.costo?: number | null` (líneas 82-91), frente a
  `ProductoCreate.costo: int | None = Field(default=None, ge=0)` /
  `ProductoUpdate.costo: int | None = Field(default=None, ge=0)` /
  `ProductoOut.costo: int | None` en el schema real. Correcto.
- **Columna "Margen" con `null`:** `ProductosView.vue` líneas 376-381 usa
  `producto.costo === null` (no un check "falsy") para decidir entre el span
  `N/D` (`margen--sin-definir`, con `title="Costo no definido"`) y
  `formatCOP(margenFor(producto)!)`. Esto es importante porque distingue
  correctamente "costo = 0" (margen = precio completo, se muestra el número)
  de "costo desconocido" (`N/D`) — no cae en el bug de mostrar `$0` para
  ninguno de los dos casos. `margenFor` (líneas 86-89) replica el mismo check
  estricto `=== null`.
- **Borrado de costo sin bandera tipo `imagenTouched`:** confirmé que la
  decisión documentada en las notas de implementación es correcta y no
  introduce el bug que pedía revisar (pisar accidentalmente un costo
  existente al editar otro campo). Razón: `openEditForm` (línea 110)
  precarga `form.costo = producto.costo ?? ''` desde el producto real, y
  `onSubmit` (línea 176) **siempre** incluye `costo: form.costo === '' ? null
  : Number(form.costo)` en el payload, en cada submit, tanto crear como
  editar — igual que `precio`, que tampoco usa bandera de "tocado". La razón
  por la que `imagen_base64` sí necesita `imagenTouched` es estructural (un
  `<input type="file">` no se puede prefijar con el valor existente en el
  DOM, así que hay que distinguir "no tocado" de "tocado y vaciado"), mientras
  que `costo`, como `precio`, es un input numérico normal que sí refleja el
  valor completo en cada render del formulario. Con ese precargado, editar
  cualquier otro campo (nombre, categoría, estado, etc.) y guardar reenvía el
  mismo `costo` existente sin alterarlo; solo se pone en `null` si el usuario
  vacía explícitamente el campo antes de guardar. No hay bug.
  Adicionalmente confirmé en `backend/app/routers/productos.py` (líneas
  112-120) que `actualizar_producto` usa `"costo" in campos_enviados` sobre
  `payload.model_dump(exclude_unset=True)`, exactamente el patrón que
  requiere enviar la clave explícita para borrar — consistente con lo que
  hace el frontend.
- **Validación de costo negativo:** `onSubmit` (líneas 164-167) rechaza en
  cliente antes de enviar si `form.costo !== '' && Number(form.costo) < 0`,
  con mensaje claro. Confirmé además, leyendo `NumberInput.vue`
  (`onInput`, líneas 66-77), que el componente **no** clampea el valor
  tipeado directamente en el `<input type="number">` (solo `increment`/
  `decrement` usan `clamp`), así que sin esta validación explícita sí sería
  posible enviar un negativo tipeando; la validación cubre correctamente ese
  hueco.
- **`onToggleEstado`** (línea 229) envía `update(id, { estado })` sin incluir
  `costo`, lo cual es correcto y no pisa el costo existente gracias al mismo
  mecanismo `exclude_unset` del backend.

No encontré scope creep: no se tocó ninguna otra pantalla, no se agregó
porcentaje de margen ni gráfico, no se tocó `sabor`/`tamano`. Los criterios
de aceptación están cumplidos.

Único hallazgo menor, no bloqueante: el CSS reporta `.margen` con
`tabular-nums`, pero no encontré una regresión ni desviación de convención —
se deja constancia solo para que quede documentado que se revisó también el
estilo agregado y es consistente con el resto de la hoja scoped del archivo.
