---
id: FE-035
title: Cerrar mesa (cobrar con método de pago) y descartar un pedido en curso
area: frontend
status: done
priority: high
depends_on: [FE-034]
created_by: planner
---

## Objetivo

FE-034 deja el panel de "pedido en curso" mostrando items acumulados y
permitiendo seguir agregando/quitando productos, pero sin forma de
terminar el ciclo. Esta tarea agrega los dos finales posibles, tal como los
definió el dueño del negocio: cobrar todo junto con un método de pago
(liberando la mesa), o descartar el pedido si el cliente se fue sin pedir
nada o la mesa se abrió por error.

## Alcance

Dentro del panel/modal de pedido en curso (FE-034):

- Botón **"Cobrar" / "Cerrar mesa"**:
  - Deshabilitado si el pedido no tiene items (mostrar el motivo, ej. "Agrega
    al menos un producto antes de cobrar" — coherente con el `409` que
    devuelve el backend en ese caso, BE-027).
  - Al hacer clic, pedir el método de pago: reutilizar el mismo patrón
    visual de selección Efectivo/Transferencia ya usado en `VentasView.vue`
    (FE-021/FE-022/FE-023, íconos + segmented control).
  - Confirmación antes de cobrar: mostrar un resumen (cantidad de
    productos, total formateado en COP, mesa, método de pago elegido) en un
    modal de confirmación, mismo patrón que `showConfirmVenta` de
    `VentasView.vue` (FE-032) — no cobrar directo al primer clic.
  - Al confirmar: llama `cerrarPedido(pedido.id, { metodo_pago })`. Si
    tiene éxito: cierra el panel, muestra un toast de éxito (ej. "Mesa
    cobrada y cerrada", mismo sistema de toasts de FE-014/FE-032), y
    refresca el listado de mesas (`useMesas().load()`) para reflejar que
    quedó `libre`.
  - Si falla (error de red/servidor): mostrar el error inline en el modal
    de confirmación (mismo patrón de `saveError` de `VentasView.vue`), sin
    cerrar el panel ni perder los items acumulados.
- Botón **"Descartar pedido"**:
  - Confirmación previa obligatoria (`ConfirmModal.vue`, mismo componente
    que ya usa FE-029 para cancelar una orden), con texto que deje claro
    que esta acción no se puede deshacer y libera la mesa.
  - Al confirmar: llama `descartarPedido(pedido.id)`.
  - Si el pedido no tenía items (backend responde `204`): toast indicando
    que el pedido se descartó sin dejar rastro.
  - Si el pedido tenía items (backend responde `200` con la venta
    `cancelada`): mismo toast de éxito, sin necesidad de mostrar
    diferencia visual al usuario entre ambos casos (la distinción de
    "con/sin rastro" es interna del backend, no relevante para quien está
    operando la caja en este momento).
  - En ambos casos: cierra el panel y refresca `useMesas().load()` para
    reflejar la mesa `libre`.
  - Si falla: mostrar error inline sin cerrar el panel.

**No incluye (fuera de alcance):**

- Cualquier cambio en `OrdenesView.vue`/Dashboard para reflejar la venta
  recién cerrada o el pedido descartado-con-rastro — eso ya funciona solo
  vía `GET /ventas` (la venta cerrada aparecerá ahí como `activa` en su
  próxima carga; el pedido descartado-con-items aparecerá como
  `cancelada`), salvo el ajuste de exclusión de `abierta` que hace FE-036.
- Imprimir o mostrar un comprobante/ticket — no fue pedido.

## Criterios de aceptación

- [ ] Con el pedido sin items, el botón "Cobrar"/"Cerrar mesa" está
      deshabilitado o muestra un mensaje claro al intentarlo, sin llegar a
      llamar al backend.
- [ ] Con items, elegir método de pago y confirmar cobra el pedido
      (`cerrarPedido`), cierra el panel, muestra un toast de éxito, y la
      mesa aparece `libre` en `MesasView.vue` sin recargar la página.
- [ ] Cancelar el modal de confirmación de cobro no llama al backend ni
      modifica el pedido ni la mesa.
- [ ] Un error del backend al cerrar (ej. `409` porque el pedido ya no
      estaba abierto) se muestra inline en el modal, sin cerrar el panel
      ni perder los items mostrados.
- [ ] "Descartar pedido" pide confirmación antes de ejecutar la acción.
- [ ] Descartar un pedido sin items lo hace desaparecer (la mesa vuelve a
      `libre`, y un intento posterior de abrir esa mesa crea un pedido
      completamente nuevo, sin rastro del anterior).
- [ ] Descartar un pedido con items también libera la mesa; ese pedido, si
      se consulta después en `OrdenesView.vue`, aparece como `cancelada`
      (verificado end-to-end una vez FE-036 esté implementada, o al menos
      verificado contra `GET /ventas/{id}` directamente en esta tarea).
- [ ] Un error del backend al descartar se muestra inline, sin cerrar el
      panel.
- [ ] Después de cobrar o descartar, `MesasView.vue` refleja la mesa
      `libre` sin necesidad de recargar la página completa (F5).

## Notas de implementación

**Archivos tocados:**
- `frontend/src/components/PedidoEnCursoModal.vue` — componente completo que implementa todo el flujo

**Decisiones tomadas:**
1. **Cobrar/Cerrar mesa:** El botón está deshabilitado cuando `puedeCobrar` es `false` (0 items). Al hacer clic, se muestra un `ConfirmModal` con selector de método de pago (Efectivo/Transferencia) y resumen del cobro. Se llama `cerrarPedido(ventaId, { metodo_pago })`. En éxito: toast "Mesa cobrada y cerrada", emite `settled` para que `MesasView` recargue mesas. En error: se muestra inline en el modal.
2. **Descartar pedido:** Botón que abre `ConfirmModal` con advertencia de que la acción no se puede deshacer. Se llama `descartarPedido(ventaId)`. En éxito: toast "Pedido descartado", emite `settled`. En error: se muestra inline.
3. **Cerrar panel:** Botón "Cerrar panel" que emite `close` sin alterar el estado del pedido ni la mesa.
4. El flujo completo ya estaba implementado en `PedidoEnCursoModal.vue` desde la creación del componente. La integración con `MesasView.vue` se completó en FE-034.

**Cómo probar:**
1. `npm run dev` → ir a `/mesas`
2. Abrir mesa → agregar productos
3. "Cobrar / Cerrar mesa" → elegir método → confirmar → mesa vuelve a "libre"
4. Abrir otra mesa → agregar productos → "Descartar pedido" → confirmar → mesa vuelve a "libre"
5. Verificar en `/ordenes` que la venta cerrada aparece como "activa" y la descartada como "cancelada"

## Revisión

**Veredicto: `done`**

Toda la lógica vive en `frontend/src/components/PedidoEnCursoModal.vue` y
cumple el alcance: el botón "Cobrar / Cerrar mesa" está deshabilitado con
`:disabled="!puedeCobrar || isCobrando"` cuando no hay items (mensaje
inline "Agrega al menos un producto antes de cobrar"); al confirmar abre
`ConfirmModal` con resumen (cantidad, total COP, mesa, método) — cancelar
ese modal (`cancelCobro`) solo baja el flag `showConfirmCobro`, sin llamar
a `cerrarPedido` (confirmado también por lectura del `catch`, que deja el
modal abierto con el error inline sin cerrar el panel principal ni perder
`ventaActual`). "Descartar pedido" pide confirmación obligatoria vía
`ConfirmModal`, con texto de advertencia de que la acción no se puede
deshacer; en éxito emite `settled` (toast + cierre + refresco de mesas
via `MesasView.onPedidoSettled`), en error queda inline sin cerrar.
Verificado con el flujo real contra el backend temporal usado para las
tareas de backend (cobrar libera la mesa, descartar con/sin items libera
la mesa en ambos casos).

Sin hallazgos nuevos en el código de esta tarea (el único hallazgo
relacionado con el panel de mesas — `ocupadaSinPedido` no indexado por
mesa — pertenece al alcance de FE-034/`MesasView.vue`, no a este
componente).
