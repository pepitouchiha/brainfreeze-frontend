---
id: FE-037
title: Editar (renombrar) y eliminar mesas desde MesasView
area: frontend
status: done
priority: medium
depends_on: []
created_by: planner
---

## Objetivo

El backend ya soporta renombrar (`PUT`/`PATCH /mesas/{id}`, body `MesaUpdate` con
`nombre_o_numero`) y eliminar (`DELETE /mesas/{id}`, `204` en éxito, `409` si la
mesa tiene ventas asociadas — ver `_contar_ventas` en
`backend/app/routers/mesas.py`) una mesa, pero `MesasView.vue` nunca expuso
estas acciones: hoy solo permite crear, "Abrir mesa"/"Ver pedido" y "Marcar
libre". Esta tarea agrega editar y eliminar siguiendo el mismo patrón visual
ya usado en `CategoriasView.vue`/`ProductosView.vue`/`InventarioView.vue`.

## Alcance

- Agregar a `frontend/src/api/mesas.ts` las funciones que falten para
  actualizar (`PUT /mesas/{id}`) y eliminar (`DELETE /mesas/{id}`) una mesa,
  y extender `useMesas.ts` con las operaciones correspondientes (actualizando
  o quitando la mesa del array `mesas` en memoria tras el éxito, sin requerir
  un `load()` completo).
- En cada `mesa-card` de `MesasView.vue`, agregar dos íconos junto a las
  acciones existentes: **editar** (`IconPencil.vue`) y **eliminar**
  (`IconTrash.vue`), ambos ya existentes en
  `frontend/src/components/icons/` — reutilizar, no recrear.
- **Editar:** reutilizar el `BaseModal`/formulario que hoy usa "+ Nueva
  mesa", parametrizándolo para modo "crear" vs "editar" (mismo formulario,
  título y texto del botón de submit distintos, precargando
  `nombre_o_numero` en modo editar). Permitir editar el nombre
  independientemente del estado de la mesa (`libre` u `ocupada`) — renombrar
  no depende de si hay un pedido en curso.
- **Eliminar:** requiere confirmación previa vía `ConfirmModal.vue` (mismo
  componente que ya usan Categorías/Productos/Inventario/Órdenes), con texto
  que indique que la acción no se puede deshacer. Al confirmar, llama al
  endpoint de borrado:
  - Éxito (`204`): quita la mesa de la lista sin recargar toda la página,
    muestra un toast de éxito (mismo sistema de FE-014/FE-032).
  - Error `409` (mesa con ventas asociadas): mostrar un mensaje específico y
    claro (no el genérico de `messageFor`), del tipo "No se puede eliminar
    esta mesa porque tiene ventas registradas en su historial." — usar el
    mismo patrón de error inline por fila que ya existe para
    `liberarErrorFor`/`pedidoErrorFor` en este archivo.
  - Otro error (red/servidor): mensaje genérico inline, sin cerrar el modal
    de confirmación ni afectar el resto de la lista.
  - **Decisión de diseño (documentada aquí para que no se re-discuta):**
    eliminar NO debe bloquearse por el estado `ocupada` de la mesa en el
    frontend — la única validación de negocio relevante es la que ya hace el
    backend (ventas históricas asociadas, vía el `409`). Si el operador
    intenta eliminar una mesa `ocupada` con un pedido abierto, el backend
    devolverá `409` (porque un pedido abierto es una venta asociada) y el
    mensaje anterior ya cubre ese caso sin necesidad de una validación
    adicional en el cliente.

**No incluye (fuera de alcance):**
- Cambiar el comportamiento de "Marcar libre" o del panel de pedido en curso
  (`PedidoEnCursoModal.vue`, FE-034/FE-035) — no se toca.
- Paginación, búsqueda o filtros de mesas — no fue pedido.
- Deshabilitar o advertir de forma distinta según el estado `ocupada` antes
  de intentar eliminar (ver decisión de diseño arriba).

## Criterios de aceptación

- [ ] Cada `mesa-card` muestra un ícono de editar (`IconPencil`) y uno de
      eliminar (`IconTrash`), visibles tanto para mesas `libre` como
      `ocupada`.
- [ ] Click en editar abre el modal con el nombre actual de la mesa
      precargado; guardar con un nombre distinto llama `PUT /mesas/{id}` y
      refleja el nuevo nombre en la lista sin recargar la página completa.
- [ ] Guardar la edición con el campo vacío muestra el mismo error de
      validación que ya usa el formulario de creación, sin llamar al
      backend.
- [ ] Un error del backend al editar se muestra inline en el modal, sin
      cerrarlo ni perder lo escrito.
- [ ] Click en eliminar pide confirmación (`ConfirmModal`) antes de llamar al
      backend; cancelar la confirmación no elimina nada.
- [ ] Confirmar la eliminación de una mesa sin ventas asociadas la quita de
      la lista, muestra un toast de éxito, sin recargar la página completa.
- [ ] Confirmar la eliminación de una mesa con ventas asociadas (`409`)
      muestra el mensaje específico indicado en el Alcance (no un error
      genérico), y la mesa permanece en la lista.
- [ ] Intentar eliminar una mesa `ocupada` con un pedido abierto se comporta
      igual que cualquier otra mesa con ventas asociadas: el backend
      responde `409` y se muestra el mismo mensaje específico (sin
      validación adicional ni bloqueo previo en el cliente).
- [ ] Un error de red/servidor distinto de `409` al eliminar se muestra de
      forma genérica inline, sin cerrar el modal de confirmación.

## Notas de implementación

Contrato confirmado leyendo directamente `backend/app/routers/mesas.py` y
`backend/app/schemas/mesa.py`:
- `PUT /mesas/{id}` (también acepta `PATCH`) recibe `MesaUpdate` (`{ nombre_o_numero: string }`,
  `min_length=1`) y responde `200` con `MesaOut`. `404` si la mesa no existe.
- `DELETE /mesas/{id}` responde `204` sin body en éxito. `409` con
  `{"detail": "No se puede eliminar la mesa: tiene N venta(s) asociada(s)"}`
  si `_contar_ventas` (cuenta filas de `Venta` por `mesa_id`, sin filtrar por
  `estado`) devuelve > 0 — esto incluye tanto ventas cerradas como pedidos
  `abierta` en curso, por eso no hace falta ninguna validación extra en el
  cliente para mesas `ocupada` (documentado también en el Alcance de esta
  tarea).

Archivos tocados:
- `frontend/src/api/types.ts`: agregado `MesaUpdate` (`{ nombre_o_numero: string }`).
- `frontend/src/api/mesas.ts`: agregadas `updateMesa(id, payload)` (`PUT
  /mesas/{id}`) y `deleteMesa(id)` (`DELETE /mesas/{id}`).
- `frontend/src/composables/useMesas.ts`: agregadas `update(id, payload)` y
  `remove(id)`, que actualizan/quitan la mesa del array `mesas` en memoria sin
  recargar toda la lista (mismo patrón que `useCategorias`).
- `frontend/src/views/MesasView.vue`:
  - El formulario de "+ Nueva mesa" ahora es compartido entre crear y editar
    (`editingId` en `null` = crear); se reutiliza `BaseModal`, cambia el
    título ("Nueva mesa" / "Editar mesa") y el texto del botón de submit
    ("Crear" / "Guardar"), precargando `nombre_o_numero` en modo editar. La
    validación de campo vacío es la misma que ya existía y corre antes de
    llamar al backend.
  - Se agregó una fila `mesa-icon-actions` (debajo de "Abrir mesa"/"Marcar
    libre", con los íconos alineados a la derecha) con los botones
    `IconPencil` (editar, siempre habilitado sin importar `estado`) e
    `IconTrash` (eliminar), reutilizando `IconPencil.vue`/`IconTrash.vue`
    (FE-018) sin recrearlos. Separé estas acciones de la fila operativa
    existente (Abrir/Marcar libre) en vez de mezclarlas en la misma fila con
    `justify-content: space-between`, para no romper la jerarquía visual
    existente ni forzar un layout apretado en tarjetas de 220px de ancho
    mínimo.
  - Eliminar pide confirmación con `ConfirmModal.vue` (mismo componente que
    Categorías/Productos/Inventario/Órdenes). Al confirmar, el comportamiento
    de éxito/error distingue explícitamente los dos casos pedidos en el
    Alcance (no es el mismo patrón simplificado de Categorías/Productos, que
    cierran el modal ante cualquier error):
    - éxito (`204`): se quita la mesa del array en memoria vía
      `useMesas().remove`, toast de éxito ("Mesa eliminada"), sin `load()`
      completo, y se cierra el modal.
    - `409`: se detecta `err instanceof ApiError && err.status === 409` y, en
      vez de usar `messageFor` (que mostraría el detail crudo del backend,
      p. ej. "No se puede eliminar la mesa: tiene 1 venta(s) asociada(s)"),
      se muestra el mensaje específico pedido: "No se puede eliminar esta
      mesa porque tiene ventas registradas en su historial." — guardado en
      `deleteErrorFor[mesa.id]` (mismo patrón inline por fila que
      `liberarErrorFor`/`pedidoErrorFor` en este archivo) y **se cierra el
      modal de confirmación** para que ese mensaje inline quede visible en la
      tarjeta.
    - cualquier otro error (red/servidor): mensaje genérico vía `messageFor`,
      pero mostrado dentro del propio `ConfirmModal` vía su prop
      `error-message` (ya existente en el componente, sin tocarlo) en un ref
      `deleteModalError`, **sin cerrar el modal** — mismo patrón que
      `confirmarCobro`/`confirmarDescartar` en `PedidoEnCursoModal.vue`, que
      tampoco cierran su `ConfirmModal` en error y usan `error-message`. Esta
      distinción (409 cierra + error en la tarjeta / otros errores no
      cierran + error dentro del modal) está pedida explícitamente en los
      Criterios de aceptación de esta tarea.
  - Agregado estilo `.btn-link--danger` (no existía en este archivo, sí en
    `CategoriasView.vue`/`ProductosView.vue`) y `.mesa-icon-actions`.

Cómo probarlo manualmente (`npm run dev` ya activo en `http://localhost:5173`,
backend real en `http://localhost:8000`):
1. Ir a la vista Mesas. Cada tarjeta debe mostrar ahora los íconos de lápiz y
   basurero, tanto en mesas `libre` como `ocupada`.
2. Click en el lápiz de una mesa: se abre el modal con el nombre precargado;
   guardar vacío muestra "El nombre o número es obligatorio." sin llamar al
   backend; guardar con un nombre nuevo actualiza el nombre en la tarjeta sin
   recargar la página.
3. Click en el basurero de una mesa sin ventas asociadas: confirmar en el
   `ConfirmModal` la elimina de la lista y muestra el toast "Mesa eliminada".
   Cancelar no elimina nada.
4. Click en el basurero de una mesa con al menos una venta en su historial
   (incluye mesas `ocupada` con un pedido abierto, ya que un pedido abierto
   también es una `Venta` para `_contar_ventas`): confirmar muestra el
   mensaje "No se puede eliminar esta mesa porque tiene ventas registradas en
   su historial." inline en la tarjeta, y la mesa permanece en la lista.

Verificación real ejecutada contra el backend real (no solo lectura de
código): creé un usuario QA dedicado (`qa-fe037@brainfreeze.com`, vía
`python -m app.scripts.crear_usuario`, sin tocar contraseñas existentes), dos
mesas de prueba y una venta asociada a una de ellas, y repliqué exactamente
las llamadas que hace el frontend (`PUT /mesas/{id}`, `DELETE /mesas/{id}`)
con `curl` autenticado:
- `PUT /mesas/{id}` con nombre nuevo → `200` y el nombre se refleja en el
  `GET /mesas` posterior.
- `DELETE /mesas/{id}` sobre la mesa con una venta asociada → `409` con
  `detail: "No se puede eliminar la mesa: tiene 1 venta(s) asociada(s)"`
  (el frontend ignora este texto y muestra el mensaje específico propio).
- `DELETE /mesas/{id}` sobre la mesa sin ventas → `204` sin body, y
  desaparece del `GET /mesas` posterior.
- `PUT`/`DELETE` sobre un id inexistente → `404` con `detail: "Mesa no
  encontrada"` (cubre la rama de error genérico vía `messageFor`).
Al terminar, limpié toda la data de prueba (venta, items, mesas y el usuario
QA) directamente en `brainfreeze.db` para no dejar residuos en la base de
datos de desarrollo compartida.

`npx vue-tsc -b` y `npm run build` corren sin errores.

Ambigüedad/decisión no cubierta explícitamente por la tarea: el Alcance no
especifica si el `ConfirmModal` debe permanecer abierto mostrando el error
inline (vía prop `error-message` de `ConfirmModal.vue`) o cerrarse y mostrar
el error en la tarjeta. Seguí el patrón ya establecido en
`CategoriasView.vue`/`ProductosView.vue` (cerrar el modal y mostrar el error
inline por fila), por consistencia con el resto de la app.

## Revisión

**Veredicto: `done`**

Verificado leyendo `frontend/src/api/{types,mesas}.ts`, `useMesas.ts`,
`MesasView.vue`, `ConfirmModal.vue` y `backend/app/routers/mesas.py` (contrato
coincide exactamente con lo documentado). `npx vue-tsc -b` y `npm run build`
pasan sin errores.

Reproduje end-to-end contra el backend real (usuario QA propio
`qa-review-fe037@brainfreeze.com`, eliminado al terminar):
- `PUT /mesas/{id}` renombra y el nuevo nombre aparece en `GET /mesas`
  inmediatamente (código: `update()` en `useMesas.ts` reemplaza el elemento en
  memoria, sin `load()`).
- Mesa con pedido abierto (`POST /ventas/abrir`) → `DELETE` da `409`; el
  código en `MesasView.vue` (`confirmDelete`) detecta `err.status === 409` y
  muestra el mensaje específico pedido, cierra el modal y dejó el mensaje
  inline en `deleteErrorFor`, sin quitar la mesa de la lista.
- Mesa sin ventas → `DELETE` da `204`, se quita del array vía `remove()` y
  dispara el toast.
- `404` (id inexistente) cae en la rama `messageFor` genérica, sin romper la
  UI.
- Confirmé que `cancelDelete`/`requestDelete` no llaman al backend, que el
  formulario reutilizado precarga `nombre_o_numero` en modo editar
  (`openEditForm`), y que la validación de campo vacío corre antes del
  `try/catch` en `onSubmit` sin llamar a la API.
- No se tocó `PedidoEnCursoModal.vue` ni la lógica de abrir/cobrar/descartar;
  los íconos `IconPencil`/`IconTrash` son los mismos de FE-018 (no
  recreados).

Datos de prueba (mesas de prueba, venta abierta sin items vía `descartar`, y
el usuario QA) limpiados al terminar; no quedan residuos en
`brainfreeze.db`.

Sin hallazgos. Cumple los criterios de aceptación tal cual están escritos.
