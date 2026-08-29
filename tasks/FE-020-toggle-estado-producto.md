---
id: FE-020
title: "Switch/toggle para el campo Estado de producto (form + tabla)"
area: frontend
status: done
priority: medium
depends_on: []
created_by: planner
---

## Objetivo

El usuario pidió que el campo Estado de un producto (`disponible`/`agotado`) se
vea como un switch/interruptor "on/off" en vez de su representación actual, para
poder "activar y desactivar" el producto de forma más visual e inmediata.

Hoy `estado` se edita únicamente con un `<select id="prod-estado" v-model="form.estado">`
dentro del formulario de crear/editar (`ProductosView.vue`, dentro de `BaseModal`), y se
muestra en la tabla como una etiqueta de solo lectura
(`<span class="tag" :class="tag--disponible / tag--agotado">`). No existe hoy ninguna
forma de cambiar el estado sin abrir el modal completo de edición.

## Alcance

Decisión de alcance del planner: se implementan **ambas** partes (no solo el `<select>`
del formulario), porque un toggle de "activar/desactivar" rápido en la fila de la
tabla encaja mejor con la intención expresada por el usuario, y el backend ya soporta
un `PATCH /productos/{id}` con solo `{ estado: ... }` sin tocar el resto de campos
(confirmado en `backend/app/routers/productos.py`; `estado` nunca se envía como
`null`, siempre es un valor válido del enum `EstadoProducto`, así que no depende de
ningún fix de `PATCH` pendiente).

Incluye:

1. **Componente reutilizable `ToggleSwitch.vue`** en
   `frontend/src/components/common/` (no existe ningún componente de switch en el
   proyecto hoy — créalo desde cero, sin librerías externas, siguiendo el patrón de
   los demás componentes de esa carpeta como `BaseModal.vue`/`ConfirmModal.vue`).
   - Componente controlado: prop `modelValue: boolean`, emite
     `update:modelValue` (soporta `v-model`).
   - Prop `disabled?: boolean` para deshabilitarlo mientras hay un guardado en curso.
   - Accesible: elemento con `role="switch"`, `aria-checked` reflejando
     `modelValue`, operable por teclado (Enter/Espacio activan el cambio — usar un
     `<button type="button">` como base cubre esto de forma nativa).
   - Prop `ariaLabel?: string` (o similar) para que cada uso pueda describir qué
     está encendiendo/apagando (relevante para el toggle inline de la tabla, donde
     cada fila es un producto distinto).
   - Estética neón consistente con el resto de la app: estado "on" usa
     `var(--color-lime)` (mismo verde que hoy usa `.tag--disponible`), estado "off"
     usa `var(--color-text-muted)` o `var(--color-border)` (mismo tono apagado que
     hoy usa `.tag--agotado`). No inventes una paleta nueva.

2. **Formulario de crear/editar producto** (`ProductosView.vue`, dentro del
   `BaseModal`, línea ~264-268 actual): reemplazar el `<select id="prod-estado"
   v-model="form.estado">` por `<ToggleSwitch>`.
   - `form.estado` sigue siendo `EstadoProducto` (`'disponible' | 'agotado'`); el
     `ToggleSwitch` trabaja con `boolean`, así que se necesita un mapeo (ej. un
     `computed` con get/set que traduzca `'disponible' <-> true` y
     `'agotado' <-> false`) — no cambies el tipo de `form.estado`.
   - El switch por sí solo no es autoexplicativo sobre cuál lado es cuál: junto al
     switch debe mostrarse un texto visible que indique el estado actual
     ("Disponible" / "Agotado"), actualizado en vivo al mover el switch.
   - Mantener el `<label for="prod-estado">Estado</label>` existente, enlazado al
     control (vía `id="prod-estado"` en el elemento raíz del switch o
     `aria-labelledby`, lo que sea compatible con el markup del `ToggleSwitch`).
   - Deshabilitado mientras `isSaving` es `true`, igual que el `<select>` actual.
   - El flujo de guardado NO cambia: el nuevo valor de `estado` se sigue
     confirmando solo al enviar el formulario completo (botón "Guardar"), igual
     que hoy — este punto del formulario no dispara ningún PATCH por sí solo.

3. **Toggle inline en la tabla de productos** (`ProductosView.vue`, columna
   "Estado" de cada fila, línea ~323-326 actual): reemplazar el
   `<span class="tag">` de solo lectura por un `<ToggleSwitch>` que refleje
   `producto.estado`, acompañado del mismo texto "Disponible"/"Agotado" al lado
   (mismo criterio de claridad que en el punto 2).
   - Al cambiar el toggle de una fila, disparar de inmediato (sin abrir el modal,
     sin botón de confirmación aparte) un `update(producto.id, { estado: nuevoValor
     })` usando `useProductos().update` — que ya acepta un `ProductoUpdate`
     parcial — para hacer un `PATCH /productos/{id}` que solo envía `estado`.
   - Manejo de loading: mientras ese `PATCH` está en curso para una fila, ese
     switch en particular debe quedar `disabled` (usar un estado reactivo por fila,
     ej. `Record<number, boolean>`, para no bloquear el resto de la tabla ni el
     switch del formulario).
   - UI optimista con reversión en error: al mover el switch, refleja el nuevo
     valor de inmediato en la fila; si el `PATCH` falla, revertir visualmente esa
     fila al valor anterior y mostrar un toast de error (`useToast().push(...,
     'error')`) con el mensaje vía `messageFor(err, 'No fue posible actualizar el
     estado.')` (mismo patrón de `messageFor` ya usado en `onSubmit`). Si el
     `PATCH` tiene éxito, mostrar un toast de éxito (ej. `'Estado actualizado'`),
     consistente con el sistema de toasts de FE-014.
   - El toggle inline no debe abrir el modal de edición ni disparar ningún otro
     handler de la fila (debe funcionar independiente de los botones de
     Editar/Eliminar de la columna de acciones).
   - Accesibilidad: cada switch de fila debe tener un `aria-label` distintivo que
     incluya el nombre del producto (ej. `"Cambiar estado de {producto.nombre}"`),
     para que sea identificable con lector de pantalla al haber varias filas.

No incluye:

- `InventarioView.vue` — ahí `estado` de un insumo (`Crítico`/`Bajo`/`OK`) se
  calcula siempre en el backend a partir de stock/stock_mínimo, nunca se envía
  como input (confirmado en `frontend/src/api/types.ts`); no aplica un switch y
  no debe tocarse ese archivo.
- Cambios al backend: `PATCH /productos/{id}` ya soporta actualizar solo `estado`
  sin tocar el resto de campos; no se requiere ninguna tarea de `backend/tasks/`
  para esto.
- Cualquier cambio a la columna de acciones (iconos Editar/Eliminar, borde de la
  celda) — eso ya está cubierto por FE-018/FE-019 y no debe modificarse aquí más
  allá de lo estrictamente necesario para insertar el toggle en la columna
  "Estado" (columna distinta a la de acciones).
- Agregar el `ToggleSwitch` a ningún otro formulario/vista del proyecto (ej. no
  tocar `MesasView.vue` ni `CategoriasView.vue`); el componente se crea reutilizable
  a futuro, pero esta tarea solo lo consume en `ProductosView.vue`.

## Criterios de aceptación

- [ ] Existe `frontend/src/components/common/ToggleSwitch.vue`: componente
      controlado con `v-model` sobre un `boolean` (`modelValue` + evento
      `update:modelValue`), prop `disabled?: boolean`, y alguna prop para
      etiqueta accesible (ej. `ariaLabel`). No usa ninguna librería externa de UI.
- [ ] El control raíz del `ToggleSwitch` tiene `role="switch"` y `aria-checked`
      igual a `modelValue`, y es operable con teclado (foco visible + Enter o
      Espacio cambian el valor) — verificable navegando solo con teclado.
- [ ] Estado visual "on" (equivalente a `disponible`) usa `var(--color-lime)`;
      estado "off" (equivalente a `agotado`) usa `var(--color-text-muted)` o
      `var(--color-border)` — mismos tonos que ya usan `.tag--disponible` /
      `.tag--agotado`, sin introducir colores nuevos.
- [ ] En el formulario de crear/editar producto, el `<select id="prod-estado">`
      fue reemplazado por `<ToggleSwitch>`; `form.estado` conserva el tipo
      `EstadoProducto` (el mapeo a `boolean` vive en un `computed` u equivalente,
      no en el tipo del formulario).
- [ ] Junto al switch del formulario se muestra un texto visible con el estado
      actual ("Disponible" / "Agotado") que se actualiza en vivo al mover el
      switch, antes de guardar.
- [ ] El switch del formulario respeta `:disabled="isSaving"` igual que el
      `<select>` anterior, y el valor de `estado` solo se persiste al enviar el
      formulario (botón "Guardar") — no dispara ningún request por sí solo al
      moverlo.
- [ ] Crear un producto nuevo con el switch en "Disponible" (default) y guardarlo
      produce el mismo resultado que antes (`estado: 'disponible'` en el payload
      de `create`). Moverlo a "Agotado" antes de guardar produce
      `estado: 'agotado'` en el payload.
- [ ] Editar un producto existente: `openEditForm` sigue posicionando el switch
      según `producto.estado` real (abrir para editar un producto "Agotado"
      muestra el switch en off/"Agotado", no en el default).
- [ ] En la tabla de productos, la columna "Estado" de cada fila muestra un
      `<ToggleSwitch>` (reemplazando el `<span class="tag">` de solo lectura)
      reflejando `producto.estado`, con el texto "Disponible"/"Agotado" al lado.
- [ ] Mover el toggle inline de una fila dispara de inmediato un
      `update(producto.id, { estado: nuevoValor })` (PATCH solo con `estado`, sin
      reenviar `nombre`/`categoria_id`/`precio`/`imagen_base64`), sin abrir el
      modal de edición.
- [ ] Mientras ese `PATCH` está en curso, el switch de esa fila específica queda
      `disabled`; los switches de otras filas y el del formulario no se ven
      afectados.
- [ ] Si el `PATCH` del toggle inline tiene éxito: el valor queda reflejado
      (ya sea porque se actualiza `producto.estado` en el arreglo local con la
      respuesta del backend, o se refresca la lista) y se muestra un toast de
      éxito vía `useToast().push(...)`.
- [ ] Si el `PATCH` del toggle inline falla: el switch de esa fila vuelve
      visualmente a su valor anterior (no queda en un estado inconsistente con el
      backend) y se muestra un toast de error con
      `messageFor(err, 'No fue posible actualizar el estado.')` (o mensaje
      equivalente).
- [ ] El toggle inline no interfiere con los botones de Editar/Eliminar de la
      columna de acciones (columna distinta, sin overlap de eventos/clicks).
- [ ] Cada switch de fila tiene un `aria-label` que incluye el nombre del
      producto de esa fila (identificable individualmente con lector de
      pantalla).
- [ ] `InventarioView.vue` no fue modificado.
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- Nuevo componente `frontend/src/components/common/ToggleSwitch.vue`: `<button type="button" role="switch">`
  controlado (`modelValue: boolean` + `update:modelValue`), props `disabled?`, `ariaLabel?`, `id?` (para poder
  enlazar el `<label for="prod-estado">` existente sin cambiar su markup). Estado "on" usa `var(--color-lime)`
  (thumb + fondo del track en rgba derivado del mismo verde), estado "off" usa `var(--color-text-muted)` para el
  thumb y `var(--color-border)` para el borde del track — sin colores nuevos. Foco visible con
  `outline: 2px solid var(--color-cyan)` (mismo patrón que `.btn-link:focus-visible` en el resto de la app).
  Operable con teclado de forma nativa al ser un `<button>` (Enter/Espacio disparan `click`).

- `ProductosView.vue`:
  - Formulario: el `<select id="prod-estado">` fue reemplazado por `<ToggleSwitch id="prod-estado" v-model="formEstadoDisponible" :disabled="isSaving">`
    más un `<span>` con el texto "Disponible"/"Agotado" en vivo. `formEstadoDisponible` es un `computed` con
    get/set que traduce `form.estado` (`EstadoProducto`, sin cambiar su tipo) a `boolean` y viceversa. El
    `estado` sigue viajando solo en el payload de `onSubmit` (`create`/`update`), sin ningún request al mover
    el switch.
  - Tabla: la columna "Estado" reemplaza el `<span class="tag">` de solo lectura por `<ToggleSwitch>` +
    texto, ligado a `producto.estado === 'disponible'`. Al moverlo, `onToggleEstado(producto, disponible)`
    aplica el cambio de forma optimista sobre el objeto `producto` del array reactivo, marca
    `estadoUpdating[producto.id] = true` (deshabilita solo ese switch) y llama a
    `update(producto.id, { estado: nuevoEstado })` (PATCH parcial, solo `estado`). Si tiene éxito, sincroniza
    `producto.estado` con la respuesta del backend y muestra toast `'Estado actualizado'`. Si falla, revierte
    `producto.estado` al valor previo y muestra `messageFor(err, 'No fue posible actualizar el estado.')` como
    toast de error. `estadoUpdating` es un `Record<number, boolean>` reactivo, independiente por fila y del
    switch del formulario (que usa `isSaving`).
  - `aria-label` de cada fila: `` `Cambiar estado de ${producto.nombre}` ``, distintivo por producto.
  - Se eliminaron las clases CSS `.tag`/`.tag--disponible`/`.tag--agotado` (ya sin uso) y se agregó
    `.estado-toggle`/`.estado-toggle__label` para el layout switch + texto (usado en form y tabla).
  - `InventarioView.vue` no fue tocado.

- Cómo probar manualmente: `npm run dev`, ir a Productos.
  - Formulario: abrir "Nuevo producto", mover el switch de Estado, verificar que el texto cambia en vivo y que
    solo se persiste al hacer clic en "Guardar" (revisar Network: sin requests al mover el switch). Editar un
    producto "Agotado" y confirmar que el switch abre en off/"Agotado".
  - Tabla: mover el switch de una fila y confirmar el `PATCH /productos/{id}` con body `{"estado": "..."}`
    únicamente, el toast de éxito, y que el switch queda `disabled` brevemente durante la llamada. Para probar
    el rollback en error, cortar el backend momentáneamente y mover un switch: debe volver a su valor anterior
    y mostrar el toast de error.
  - Teclado: tabular hasta un switch y activar con Espacio/Enter; foco visible en cian.
  - `npx vue-tsc -b` y `npx vite build` corren sin errores (verificado).

## Revisión

**Veredicto: done**

Revisado el código completo (no solo la captura visual): `frontend/src/components/common/ToggleSwitch.vue`,
`frontend/src/views/ProductosView.vue`, `frontend/src/composables/useProductos.ts`, `frontend/src/api/productos.ts`,
`frontend/src/api/types.ts`, `frontend/src/api/client.ts`, y el backend (`backend/app/routers/productos.py`,
`backend/app/schemas/producto.py`).

Verificaciones puntuales pedidas:

- **Reversión en error (`onToggleEstado`, `ProductosView.vue:209-224`)**: correcta. Guarda `anterior = producto.estado`
  antes del update optimista, y en el `catch` hace `producto.estado = anterior` + toast de error con
  `messageFor(err, 'No fue posible actualizar el estado.')`. `estadoUpdating[producto.id]` se marca `true` de forma
  síncrona antes del `await`, así que el switch de esa fila queda deshabilitado en el siguiente render, evitando doble
  disparo mientras el PATCH está en curso; el `finally` limpia la entrada del record independientemente del resultado.
- **No reintroduce el bug de FE-011**: el body enviado es literalmente `{ estado: nuevoEstado }` (objeto con una sola
  clave), serializado vía `JSON.stringify` en `apiClient.patch` — no hay `undefined`/`null` colándose para
  `nombre`/`categoria_id`/`precio`/`imagen_base64`. Confirmado además en vivo contra el backend real (login con
  `admin@brainfreeze.com`, `PATCH /productos/14` con body `{"estado":"agotado"}`): la respuesta y el `GET` posterior
  muestran `nombre`, `precio`, `imagen_base64` intactos, solo `estado` cambia. El router (`actualizar_producto`) usa
  `payload.estado is not None` y `model_dump(exclude_unset=True)` para los demás campos opcionales, consistente con
  el fix de FE-011.
- **Accesibilidad**: `<button type="button" role="switch">` con `:aria-checked="modelValue"` (Vue serializa
  correctamente a `"true"/"false"` como string de atributo, no lo omite). Operable por teclado de forma nativa
  (Enter/Espacio en un `<button>`), foco visible vía `:focus-visible { outline: 2px solid var(--color-cyan) }`
  consistente con `.btn-link:focus-visible`. Colores: on = `var(--color-lime)` (mismo verde de
  `.tag--disponible` histórico), off = `var(--color-text-muted)` para el thumb y `var(--color-border)` para el
  track — sin paleta nueva, variables confirmadas en `tokens.css`. Cada fila usa
  `` `Cambiar estado de ${producto.nombre}` `` como `aria-label` distintivo; el switch del formulario usa
  `aria-label="Estado del producto"` además de estar enlazado por `id="prod-estado"` al `<label for="prod-estado">`
  existente (la doble anotación —aria-label + label asociado— es redundante pero inocua, no rompe nada).
- `npx vue-tsc -b` y `npx vite build` corridos: ambos pasan sin errores ni warnings.
- Confirmado que `InventarioView.vue` no fue tocado y que `ToggleSwitch` solo se usa en `ProductosView.vue` (sin
  scope creep a `MesasView.vue`/`CategoriasView.vue`).
- Clases `.tag`/`.tag--disponible`/`.tag--agotado` eliminadas de `ProductosView.vue`; siguen usándose sin problema
  en `DashboardView.vue`/`InventarioView.vue` (no afectadas por este cambio).

Todos los criterios de aceptación se cumplen. No se encontraron hallazgos bloqueantes.

`status: done`

