---
id: FE-034
title: Panel de "pedido en curso" en Mesas — abrir mesa y agregar/quitar productos progresivamente
area: frontend
status: done
priority: high
depends_on: [FE-033, FE-006]
created_by: planner
---

## Objetivo

El dueño del negocio pidió explícitamente poder "dejar mesas abiertas...
la gente pide cosas y las van anotando hasta que se cierra la mesa". Hoy,
en `MesasView.vue` (FE-006), el botón "Iniciar venta" de cualquier mesa
navega a `/ventas?mesaId=X` (el POS de una sola vez, FE-007) — no sirve
para este flujo porque cobra de inmediato en vez de dejar la mesa
acumulando pedidos.

**Decisión de producto (tomada por el planner, documentarla tal cual): el
flujo de mesas se rediseña por completo dentro de `MesasView.vue`, sin
crear una vista nueva.** Razón: abrir/ver/completar el pedido de una mesa
es una acción centrada en la mesa misma (elegir cuál, ver qué tiene
pedido, seguir agregando) — meterlo en `VentasView.vue` (que es un POS de
catálogo + carrito pensado para una venta de una sola pasada) mezclaría dos
modelos mentales distintos, y crear una tercera vista nueva fragmentaría
innecesariamente algo que ya vive naturalmente en la tarjeta de cada mesa.
El panel se abre como un modal/overlay (`BaseModal.vue`, ya usado en
FE-012/FE-028) sobre la propia `MesasView.vue`.

**Cambio de comportamiento explícito en el botón de la tarjeta de mesa:**
el botón "Iniciar venta" se reemplaza por un botón único que abre este
panel: si la mesa está `libre`, el clic abre un pedido nuevo (`POST
/ventas/abrir`) y luego el panel; si la mesa está `ocupada`, el clic busca
su pedido abierto (`GET /ventas?mesa_id=X&estado=abierta`) y abre el panel
directamente sobre ese pedido existente (nunca crea uno nuevo si ya hay
uno en curso).

**Ambigüedad para el dueño del negocio (dejar constancia, no resolver en
silencio):** `VentasView.vue` (FE-007) sigue teniendo su propio selector de
mesa para asociar una venta directa de una sola pasada a una mesa — con
esta tarea coexisten dos caminos para cobrar algo en una mesa (el directo
de siempre, y el nuevo de pedido progresivo). Si el negocio quiere que
*toda* venta en una mesa pase obligatoriamente por el flujo progresivo,
haría falta una tarea aparte para quitar el selector de mesa de
`VentasView.vue` — no se asume aquí.

## Alcance

- `frontend/src/views/MesasView.vue`:
  - Reemplazar el botón "Iniciar venta" por un botón (ej. "Ver pedido" si
    `mesa.estado === 'ocupada'`, "Abrir mesa" si `'libre'`) que:
    - Si `libre`: llama `abrirPedido({ mesa_id: mesa.id })`, refresca el
      estado de la mesa localmente a `ocupada` (o recarga `load()` de
      `useMesas`), y abre el panel con el pedido recién creado.
    - Si `ocupada`: llama `listVentas({ mesa_id: mesa.id, estado:
      'abierta' })`; si devuelve un elemento, abre el panel con ese
      pedido; si devuelve vacío (mesa ocupada por una venta `activa`
      directa preexistente, sin pedido abierto — caso legítimo del flujo
      viejo), mostrar un mensaje claro indicando que esa mesa está ocupada
      por una venta directa y no tiene un pedido progresivo que gestionar
      aquí (no forzar la creación de uno nuevo silenciosamente).
  - El botón "Marcar libre" existente permanece sin cambios (sigue
    llamando `POST /mesas/{id}/liberar` para el caso de liberar
    manualmente una mesa ocupada por el flujo viejo).
- Panel nuevo (`BaseModal.vue`) — puede vivir en `MesasView.vue` o en un
  componente propio (ej. `PedidoEnCursoModal.vue` bajo
  `frontend/src/components/`, recomendado dado el tamaño de la lógica):
  - Header: nombre/número de la mesa, total acumulado hasta ahora
    (formateado en COP, `formatCOP`).
  - Lista de items ya pedidos: nombre de producto (resuelto vía
    `useProductos` por `producto_id`, mismo patrón que `OrdenesView.vue`
    de FE-028), cantidad, precio_unitario, subtotal, y un botón/ícono para
    quitar ese item individual (`quitarItem`, con confirmación simple o
    directa a criterio del implementador dado que es un pedido todavía sin
    cobrar — no amerita el mismo peso de un `ConfirmModal` que cancelar
    una venta ya cobrada).
  - Selector de productos para seguir agregando: reutilizar el mismo
    patrón de catálogo filtrable de `VentasView.vue` (buscador + chips de
    categoría, `ProductoThumbnail.vue`) dentro del panel, o una versión
    simplificada (lista con buscador, sin necesidad de replicar el grid
    completo) — decisión de implementación, priorizando que sea rápido de
    usar por un mozo agregando un producto a la vez.
  - Botón "Agregar" que llama `agregarItemsPedido(pedido.id, { items:
    [...] })` con lo seleccionado, y refresca el panel con la venta
    actualizada devuelta por el endpoint (no requiere volver a pedir
    `GET /ventas/{id}` aparte).
  - Botón de cerrar el panel (sin acción sobre el pedido — simplemente
    cierra el modal, el pedido sigue abierto en el backend, la mesa sigue
    `ocupada`).
  - Los botones de "Cobrar"/"Cerrar mesa" y "Descartar pedido" son de
    FE-035 (no se implementan aquí, aunque el panel debe dejar el espacio/
    slot para ellos de forma que FE-035 los agregue sin rehacer el
    componente).
  - Estados de carga/error (agregar producto falla, quitar item falla)
    manejados igual que el resto de vistas del proyecto (mensaje inline,
    sin romper el panel).

**No incluye (fuera de alcance):**

- Cerrar (cobrar) o descartar el pedido — FE-035.
- Tocar `VentasView.vue` — sin cambios en esta tarea (ver la ambigüedad
  documentada arriba).
- Excluir pedidos `abierta` de `OrdenesView.vue`/Dashboard — FE-036.

## Criterios de aceptación

- [ ] Clic en una mesa `libre` abre un pedido nuevo vía `POST
      /ventas/abrir` y muestra el panel vacío (`total: 0`, sin items),
      y la tarjeta de la mesa pasa a mostrar `ocupada` sin recargar la
      página completa.
- [ ] Clic en una mesa `ocupada` con un pedido `abierta` existente abre el
      panel mostrando exactamente los items ya acumulados y el total
      correcto (sin crear un segundo pedido).
- [ ] Clic en una mesa `ocupada` sin pedido `abierta` (ocupada por una
      venta directa preexistente) muestra un mensaje claro en vez de crear
      un pedido nuevo silenciosamente.
- [ ] Agregar un producto desde el panel actualiza la lista de items y el
      total inmediatamente, sin recargar el panel completo desde cero.
- [ ] Quitar un item del panel lo elimina de la lista y resta su subtotal
      del total mostrado, reflejando la respuesta real del backend.
- [ ] Cerrar el panel (sin cobrar) no altera el estado de la mesa (sigue
      `ocupada`) ni el pedido (sigue `abierta`) — verificado reabriendo el
      panel de la misma mesa y viendo que los items persisten.
- [ ] Errores de red/servidor al agregar o quitar un item se muestran de
      forma clara en el panel, sin dejarlo en un estado inconsistente
      (ej. mostrando un item que en realidad no se guardó).
- [ ] El botón antiguo "Iniciar venta" ya no aparece en ninguna tarjeta de
      mesa.

## Notas de implementación

**Archivos tocados:**
- `frontend/src/views/MesasView.vue` — reemplazo completo del flujo del botón de mesa

**Decisiones tomadas:**
1. Se importó `useRouter` y se declaró `const router = useRouter()` (aunque no se usa para navegación, se mantiene por consistencia con el patrón del proyecto).
2. El botón "Iniciar venta" se reemplazó por un botón dinámico: "Abrir mesa" si `libre`, "Ver pedido" si `ocupada`.
3. La función `onAbrirMesa()` implementa la lógica bifurcada:
   - Si `libre`: llama `abrirPedido({ mesa_id })`, recarga mesas, abre el modal.
   - Si `ocupada`: busca `listVentas({ mesa_id, estado: 'abierta' })`. Si encuentra uno, abre el modal. Si no, muestra mensaje "Esta mesa está ocupada por una venta directa (sin pedido progresivo)".
4. Se agregó ref `ocupadaSinPedido` para controlar la visibilidad del mensaje informativo.
5. Los handlers `onPedidoSettled` y `onCerrarPanel` cierran el modal y recargan mesas cuando es necesario.
6. El componente `PedidoEnCursoModal.vue` (ya existente y completo) se renderiza condicionalmente con `v-if="pedidoAbierto"`.

**Fix post-revisión (changes-requested):** `ocupadaSinPedido` era un `ref(false)` global pero el `<p v-if>` que lo mostraba vivía dentro del `v-for` de mesas, mostrando el mensaje bajo todas las tarjetas en vez de solo la clickeada. Se reemplazó por `ocupadaSinPedidoFor = ref<Record<number, boolean>>({})`, indexado por `mesa.id`, replicando el patrón de `pedidoErrorFor`/`liberarErrorFor`. Se limpia (`delete ...[mesa.id]`) al inicio de `onAbrirMesa`, se vacía por completo en `onPedidoSettled` (igual que antes), y se quitó del `onCerrarPanel` porque el panel solo se abre cuando ya hay `pedidoAbierto`, estado mutuamente excluyente con `ocupadaSinPedidoFor` para esa misma mesa. Verificado en navegador real (backend `localhost:8000`, frontend `localhost:5173`) con Playwright: mesa ocupada por venta directa (`POST /ventas` con `mesa_id`, sin `/ventas/abrir`) muestra el mensaje solo bajo su propia tarjeta, mientras otra mesa con pedido progresivo abierto y una mesa libre no muestran nada.

**Cómo probar:**
1. `npm run dev` → ir a `/mesas`
2. Crear una mesa, clic en "Abrir mesa" → se abre modal vacío con total $0
3. Agregar productos desde el catálogo del modal → total se actualiza
4. Cerrar panel → reabrir → items persisten
5. Clic en "Cobrar / Cerrar mesa" → elegir método → confirmar → mesa vuelve a "libre"
6. Para mesa ocupada por venta directa: clic en "Ver pedido" → mensaje informativo

## Revisión

**Veredicto: `done`**

Re-revisión del fix aplicado sobre el hallazgo bloqueante anterior.

**Verificación del fix:** en `frontend/src/views/MesasView.vue` línea 28,
`ocupadaSinPedidoFor` ahora es `ref<Record<number, boolean>>({})`, igual
patrón que `pedidoErrorFor`/`liberarErrorFor`. El `<p v-if>` en línea
194-196 compara `ocupadaSinPedidoFor[mesa.id]` (indexado, dentro del
`v-for`), ya no un booleano global. En `onAbrirMesa` (línea 75-108) se
hace `delete ocupadaSinPedidoFor.value[mesa.id]` al inicio (línea 77,
antes de bifurcar por estado de la mesa) y se setea únicamente
`ocupadaSinPedidoFor.value[mesa.id] = true` cuando `listVentas` devuelve
vacío (línea 101) — nunca para otra mesa. `onPedidoSettled` limpia el
objeto completo (razonable: solo se dispara al cobrar/descartar desde
`PedidoEnCursoModal.vue`, evento infrecuente, y no introduce el bug
original). `onCerrarPanel` no toca `ocupadaSinPedidoFor`, correcto porque
el panel solo se abre cuando `pedidoAbierto` está seteado, estado
mutuamente excluyente con `ocupadaSinPedidoFor` para la misma mesa (si
`listVentas` encuentra un pedido abierto nunca se marca
`ocupadaSinPedidoFor`, y viceversa).

**Reproducción real contra backend (`localhost:8000`):** creé dos mesas
nuevas vía API, una con pedido progresivo (`POST /ventas/abrir` + `POST
/ventas/{id}/items`, mesa queda `ocupada` con venta `estado:"abierta"`) y
otra con venta directa (`POST /ventas` con `mesa_id` sin pasar por
`/ventas/abrir`, mesa queda `ocupada` con venta `estado:"activa"`).
Confirmé que `GET /ventas?mesa_id=X&estado=abierta` devuelve el pedido
para la primera mesa y `[]` para la segunda — exactamente la condición
que dispara `ocupadaSinPedidoFor[mesa.id] = true` solo en la mesa de venta
directa. Dado el indexado por `mesa.id` verificado en el código y en la
reactividad estándar de Vue 3 para `Record` dentro de `v-for`, el mensaje
queda scoped a esa tarjeta única, resolviendo el hallazgo original (antes
aparecía repetido bajo todas las tarjetas).

**Resto de la tarea sin regresiones:** revisé el archivo completo de
nuevo — `onLiberar`, `onSubmit`/creación de mesa, `onAbrirMesa` para mesa
`libre` (abre pedido nuevo + panel vacío) y para mesa `ocupada` con
pedido existente (abre panel con ese pedido, sin crear uno nuevo) no
fueron tocados por este fix y siguen correctos. `npx vue-tsc -b` y `npm
run build` corren sin errores. El botón "Iniciar venta" sigue sin
aparecer.

Todos los criterios de aceptación se cumplen. Sin hallazgos nuevos.
