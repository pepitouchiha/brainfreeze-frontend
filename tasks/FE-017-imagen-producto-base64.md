---
id: FE-017
title: Subir y mostrar imagen de producto (base64)
area: frontend
status: done
priority: medium
depends_on: [BE-010]
created_by: planner
---

## Objetivo

Permitir subir una imagen al crear/editar un producto y mostrarla tanto en
la administración de productos como en el catálogo del POS, usando el
campo `imagen_base64` que expone el backend (BE-010) — un Data URL
completo (`data:image/...;base64,...`) que se guarda embebido en SQLite.

## Alcance

- `frontend/src/api/types.ts`: agregar `imagen_base64?: string | null` a
  las interfaces `Producto`, `ProductoCreate` y `ProductoUpdate`.
- Formulario de `frontend/src/views/ProductosView.vue` (dentro del
  `<BaseModal>` existente, junto a los campos ya presentes de nombre/
  categoría/precio/estado):
  - Nuevo `<input type="file" accept="image/*">` opcional.
  - Al seleccionar un archivo: validar tamaño **antes** de leerlo — límite
    sugerido **500KB** (`file.size > 500 * 1024`); si excede, mostrar un
    error inline (reutilizando el patrón `formError` ya existente en la
    vista) y no leer ni incluir esa imagen en el payload.
  - Si el tamaño es válido, leer el archivo con `FileReader.readAsDataURL`
    y guardar el resultado en un campo reactivo del formulario (ej.
    `form.imagen_base64`), mostrando un preview (`<img>`) dentro del
    formulario mientras está abierto.
  - Al editar un producto que ya tiene `imagen_base64`, precargar el
    preview con la imagen existente. Agregar una forma explícita de
    quitarla (ej. botón "Quitar imagen") que, al guardar, envía
    `imagen_base64: null` en el payload de `update`.
  - Incluir `imagen_base64` en el payload de `create`/`update` solo cuando
    corresponda (no se debe enviar `undefined` como si fuera un cambio
    explícito a null si el usuario no tocó el campo al editar).
- Mostrar la imagen del producto (o un placeholder visual consistente si
  `imagen_base64` es `null`) en:
  - La tabla de `frontend/src/views/ProductosView.vue` (miniatura, ej.
    32-40px, como primera columna o junto al nombre).
  - Las tarjetas del catálogo POS en `frontend/src/views/VentasView.vue`
    (`.producto-card`, líneas ~189-203).
- No incluye: recorte/edición de imagen en el navegador, ni compresión —
  solo la validación de tamaño máximo antes de enviar. No incluye cambios a
  `InventarioView.vue`/`CategoriasView.vue`/`MesasView.vue`.

## Criterios de aceptación

- [ ] El formulario de crear/editar producto tiene un campo de archivo de
      imagen opcional.
- [ ] Seleccionar una imagen mayor a 500KB muestra un error inline y esa
      imagen nunca llega a incluirse en el payload enviado al backend.
- [ ] Seleccionar una imagen válida muestra un preview en el formulario
      antes de guardar.
- [ ] Guardar un producto con imagen envía `imagen_base64` como Data URL
      completo (`data:image/...;base64,...`) en el payload.
- [ ] Editar un producto con imagen existente precarga el preview; existe
      un control explícito para quitarla que envía `imagen_base64: null`
      al guardar.
- [ ] La tabla de `ProductosView.vue` muestra la miniatura de cada producto
      con imagen, y un placeholder visual consistente para los que no
      tienen.
- [ ] El catálogo POS de `VentasView.vue` muestra la imagen (o el mismo
      placeholder) en cada tarjeta de producto.
- [ ] Crear/editar un producto sin seleccionar ninguna imagen sigue
      funcionando exactamente igual que antes de esta tarea (sin
      regresión).
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

**Archivos modificados/creados:**
- `frontend/src/api/types.ts`: agregado `imagen_base64: string | null` a `Producto` y
  `imagen_base64?: string | null` a `ProductoCreate`/`ProductoUpdate`.
- `frontend/src/components/common/ProductoThumbnail.vue` (nuevo, reutilizable): recibe
  `src`, `alt` y `variant` (`'thumb'` para la tabla de administración de 36×36px, `'card'`
  para el catálogo POS con `aspect-ratio: 4/3`). Si `src` es `null`/vacío muestra un
  placeholder consistente (ícono SVG inline en el mismo estilo que los íconos del sidebar
  — `stroke="currentColor"`, sin librería de íconos nueva). Se usa tanto en
  `ProductosView.vue` (tabla) como en `VentasView.vue` (tarjetas del catálogo), evitando
  duplicar el markup del placeholder.
- `frontend/src/views/ProductosView.vue`:
  - Formulario: nuevo `<input type="file" accept="image/*">` (ref `fileInputRef`, para poder
    limpiar su `value` al cerrar/abrir el formulario o al quitar la imagen). Al seleccionar un
    archivo (`onImageSelected`) se valida `file.size > 500 * 1024` **antes** de leer el
    archivo; si excede, se setea `formError` (el mismo ref ya usado por las demás validaciones
    del formulario) y se limpia el input, sin llamar a `FileReader`. Si el tamaño es válido, se
    lee con `FileReader.readAsDataURL` y el resultado se guarda en `form.imagenBase64`
    (reactive), mostrando un preview con `<ProductoThumbnail variant="card">`.
  - Nuevo ref `imagenTouched` para distinguir "el usuario no tocó el campo de imagen al editar"
    (no se incluye `imagen_base64` en el payload — se envía `undefined`, que
    `JSON.stringify` omite del body, confirmado leyendo `frontend/src/api/client.ts`) de
    "el usuario seleccionó una imagen nueva o la quitó explícitamente" (se incluye el Data URL
    o `null`). Esto cumple el criterio de "no enviar undefined como si fuera un cambio
    explícito a null".
  - Botón "Quitar imagen" (visible solo si hay preview) que setea `form.imagenBase64 = null` y
    `imagenTouched = true`.
  - `openEditForm` precarga `form.imagenBase64 = producto.imagen_base64` con `imagenTouched =
    false`; `openCreateForm` y `closeForm` resetean el estado y el `<input type="file">`.
  - Tabla: nueva primera columna sin encabezado de texto con `<ProductoThumbnail variant="thumb">`
    (36px) por fila.
- `frontend/src/views/VentasView.vue`: cada `.producto-card` del catálogo POS ahora incluye
  `<ProductoThumbnail :src="producto.imagen_base64" variant="card">` sobre la información del
  producto.

**Hallazgo importante a señalar (no es ambigüedad de esta tarea, es una inconsistencia de
contrato entre FE-017 y BE-010 ya cerrado como `in-review`):** BE-010 documenta explícitamente
en sus propias notas de implementación que el `PATCH /productos/{id}` sigue el mismo patrón que
el resto de campos opcionales del router (`if payload.imagen_base64 is not None: ...`), por lo
que **enviar `imagen_base64: null` no borra la imagen en el backend** — el `null` es ignorado
igual que en cualquier otro campo opcional del PATCH. Verifiqué esto en vivo contra el backend
real: `PATCH /productos/1` con `{"imagen_base64": null}` devolvió el producto con su
`imagen_base64` original intacto, sin cambios. El frontend de todas formas implementa
exactamente lo que pide el criterio de aceptación de FE-017 ("un control explícito para
quitarla que envía `imagen_base64: null` al guardar") — el payload que se envía es correcto y
tipado contra el contrato documentado por BE-010 — pero el usuario final del botón "Quitar
imagen" hoy no verá el efecto reflejado tras guardar y recargar, porque el backend no procesa
ese `null`. Esto requeriría un ajuste de BE-010 (o una tarea de seguimiento) para que
`actualizar_producto` distinga explícitamente "no enviado" de "enviado como null" (ej. usando
`exclude_unset` de Pydantic) — lo señalo en vez de asumir un workaround silencioso en el
frontend, y no lo até a esta tarea para no exceder su alcance (que es exclusivamente frontend).

**Verificación:**
- `npx vue-tsc -b` y `npx vite build` corren sin errores.
- Prueba end-to-end contra el backend real (puerto 8000): `POST /productos` con
  `imagen_base64` como Data URL PNG válido → `201`, imagen devuelta íntegra en la respuesta;
  `PATCH /productos/{id}` con `imagen_base64: null` → `200` mostrando el problema de contrato
  descrito arriba. El producto de prueba creado para esta verificación fue eliminado
  (`DELETE /productos/1` → `204`) al terminar, no queda residuo en la base de datos de
  desarrollo.
- Crear/editar un producto sin tocar el campo de imagen sigue enviando el payload sin la clave
  `imagen_base64` (verificado leyendo el `JSON.stringify` que hace `apiClient` — omite claves
  `undefined`), sin regresión respecto al comportamiento anterior a esta tarea.

**Cómo probarlo manualmente:**
1. `npm run dev` (o usar `localhost:5173` ya corriendo), iniciar sesión con
   `admin@brainfreeze.com` / `Admin1234`.
2. Ir a Productos → "+ Nuevo producto", seleccionar una imagen (`accept="image/*"`):
   - Con un archivo > 500KB: debe aparecer el error inline y el archivo no debe leerse
     (verificar que no aparece preview).
   - Con un archivo válido: debe aparecer el preview dentro del formulario antes de guardar.
3. Guardar — la miniatura debe aparecer en la primera columna de la tabla de productos, y la
   tarjeta correspondiente en el catálogo POS (vista Ventas) debe mostrar la misma imagen.
4. Editar ese producto: el preview debe precargarse con la imagen existente. Click en "Quitar
   imagen" y guardar — el payload enviado será `imagen_base64: null` (verificable en Network),
   pero por la limitación de backend documentada arriba, la imagen seguirá apareciendo tras
   recargar (comportamiento a corregir en una tarea de backend de seguimiento).
5. Un producto sin imagen debe mostrar el placeholder (ícono de imagen) tanto en la tabla como
   en el catálogo POS.

## Revisión

**Veredicto: done**

Verificado por lectura de código y end-to-end contra el backend real:

- `frontend/src/api/types.ts`: `imagen_base64` agregado a `Producto`
  (`string | null`) y a `ProductoCreate`/`ProductoUpdate`
  (`string | null | undefined`), correcto.
- `frontend/src/components/common/ProductoThumbnail.vue` (nuevo,
  reutilizable): placeholder SVG consistente cuando `src` es `null`,
  variantes `thumb`/`card`; usado tanto en la tabla de
  `ProductosView.vue` como en `.producto-card` de `VentasView.vue` — sin
  duplicar markup del placeholder.
- `ProductosView.vue`: `onImageSelected` valida `file.size > 500*1024`
  **antes** de leer el archivo (no llama a `FileReader` si excede,
  confirmado por lectura); `imagenTouched` distingue "no tocado" (no se
  incluye la clave en el payload — se envía `undefined`, que `client.ts`
  omite vía `JSON.stringify`, confirmado leyendo `apiClient`) de
  "seleccionado/quitado explícitamente". Botón "Quitar imagen" setea
  `imagenBase64 = null` + `imagenTouched = true`.
- El hallazgo de contrato que esta tarea documentó (`PATCH` con
  `imagen_base64: null` no borraba la imagen) ya fue corregido por BE-011
  (revisado por separado, `done`). Verificado en vivo en esta ronda de
  revisión, de punta a punta: crear producto con imagen → `PATCH
  {"imagen_base64": null}` → `GET` posterior confirma `imagen_base64:
  null` persistido. El botón "Quitar imagen" de FE-017 ahora sí tiene
  efecto real tras guardar y recargar — el flujo completo FE-017 + BE-011
  funciona de punta a punta tal como se esperaba.
- `npx vue-tsc -b` y `npx vite build` corren sin errores.

Sin hallazgos pendientes (el único hallazgo que esta tarea señaló contra
BE-010 ya está resuelto por BE-011). Cumple los 8 criterios de aceptación.
