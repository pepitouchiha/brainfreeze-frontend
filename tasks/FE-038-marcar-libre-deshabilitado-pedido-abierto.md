---
id: FE-038
title: "\"Marcar libre\" no debe ofrecerse (o debe guiar a Cobrar/Descartar) en una mesa con pedido abierto"
area: frontend
status: done
priority: high
depends_on: [BE-029, FE-034, FE-035]
created_by: planner
---

## Objetivo

Bug real confirmado por el dueño del negocio: en `MesasView.vue`, el botón
"Marcar libre" solo se deshabilita hoy con `:disabled="mesa.estado ===
'libre' || liberandoId === mesa.id"` (línea ~242) — no distingue **por
qué** una mesa está `ocupada`. Si la mesa tiene un pedido `abierta` en
curso (BE-025), un operador de caja puede hacer clic en "Marcar libre",
que hasta BE-029 la marcaba libre igual dejando el pedido huérfano, y a
partir de BE-029 responderá `409`. Ya sea antes o después de BE-029, el
botón no debería ni ofrecerse en ese caso sin guiar al operador hacia el
camino correcto: abrir el panel del pedido ("Ver pedido") y usar
"Cobrar"/"Cerrar mesa" o "Descartar pedido" (FE-035), que sí liberan la
mesa correctamente.

## Alcance

En `frontend/src/views/MesasView.vue`:

- Determinar, para cada mesa `ocupada`, si tiene un pedido `abierta`
  asociado. Reutilizar la misma fuente de datos que ya usa `onAbrirMesa`
  para el caso "ocupada" (`listVentas({ estado: 'abierta' })`, filtrando
  client-side por `mesa_id`, en una única llamada al montar/recargar en
  vez de una llamada por mesa) para construir un `Set`/`Record<number,
  boolean>` de mesas con pedido abierto — sin necesidad de un endpoint
  nuevo del backend, `GET /ventas?estado=abierta` (BE-025) ya alcanza.
  Refrescar este set junto con `load()` (misma cadencia: al montar, y tras
  crear/cobrar/descartar).
- El botón "Marcar libre" pasa a deshabilitarse también cuando la mesa
  `ocupada` tiene un pedido `abierta` (además de cuando ya está `libre`),
  mostrando un texto/tooltip claro (ej. "Usa 'Ver pedido' para cobrar o
  descartar el pedido en curso" — puede ser un `title` HTML nativo del
  botón, un texto inline bajo el botón, o el mismo patrón visual ya
  usado para otros mensajes de ayuda en este archivo; decisión de
  implementación).
- Si BE-029 ya está implementada y el usuario logra de todas formas
  disparar la llamada (ej. condición de carrera: el pedido se abrió en
  otra pestaña justo después de cargar la lista), el `409` que devuelve el
  backend debe seguir mostrándose de forma legible vía el manejo de error
  ya existente (`onLiberar` -> `liberarErrorFor`, que ya usa
  `messageFor(err, ...)` y hoy expondría el `detail` del backend tal cual)
  — no hace falta un manejo especial adicional para ese caso borde, solo
  confirmar que no queda roto.
- El botón "Ver pedido"/"Abrir mesa" (`onAbrirMesa`) no cambia — sigue
  siendo el único camino, junto con el panel (FE-034/FE-035), para
  gestionar un pedido abierto.

**No incluye (fuera de alcance):**

- Cualquier cambio en `PedidoEnCursoModal.vue` (FE-034/FE-035) — no se
  toca.
- Cualquier cambio de contrato de API — se consume `GET
  /ventas?estado=abierta` tal como ya existe desde BE-025.
- Distinguir visualmente (ej. color o etiqueta distinta) entre "ocupada
  por venta directa" y "ocupada por pedido abierto" en el chip de estado
  de la tarjeta (`{{ mesa.estado === 'libre' ? 'Libre' : 'Ocupada' }}`,
  línea ~226) — no fue pedido; el alcance es puntual al botón "Marcar
  libre".

## Criterios de aceptación

- [ ] Una mesa `ocupada` con un pedido `abierta` (creado vía "Abrir mesa")
      muestra el botón "Marcar libre" deshabilitado, con un texto/tooltip
      que indique que hay que usar "Ver pedido" para cobrar o descartar.
- [ ] Una mesa `ocupada` por una venta directa `activa` (sin pedido
      `abierta`, ej. creada desde `VentasView.vue` con `mesa_id`) sigue
      mostrando "Marcar libre" habilitado y funcional exactamente igual
      que hoy — sin regresión del caso de uso original.
- [ ] Una mesa `libre` sigue mostrando "Marcar libre" deshabilitado (sin
      cambio de comportamiento).
- [ ] Cobrar o descartar un pedido desde el panel (FE-035) actualiza este
      set de "mesas con pedido abierto" de forma que, tras cerrarse el
      panel, la mesa (ahora `libre`) ya no muestra ningún estado especial
      relacionado con "Marcar libre".
- [ ] Si de todas formas se dispara `POST /mesas/{id}/liberar` sobre una
      mesa con pedido abierto (ej. condición de carrera) y el backend
      responde `409` (BE-029), el mensaje de error se sigue mostrando
      inline igual que hoy (`liberarErrorFor`), sin romper la vista.
- [ ] `npx vue-tsc -b` y `npm run build` corren sin errores.

## Notas de implementación

- `MesasView.vue`: se agregó `mesasConPedidoAbiertoIds` (`Set<number>`) poblado
  por `refreshMesasConPedidoAbierto()`, que hace una única llamada
  `listVentas({ estado: 'abierta' })` (sin filtrar por mesa) y arma el `Set`
  con los `mesa_id` no nulos client-side — sin endpoint nuevo, tal como pide
  el alcance. Se refresca en las mismas cadencias que `load()`: al montar,
  tras abrir un pedido nuevo (`onAbrirMesa`, rama `mesa.estado === 'libre'`) y
  tras cobrar/descartar (`onPedidoSettled`). Si la llamada falla, el `Set`
  queda vacío (no bloquea la vista; el `409` del backend sigue como red de
  seguridad).
- El botón "Marcar libre" ahora se deshabilita también cuando
  `mesasConPedidoAbiertoIds.has(mesa.id)`, además de las condiciones previas
  (`mesa.estado === 'libre'`, `liberandoId === mesa.id`). Se agregó
  `tituloMarcarLibre(mesa)` (helper en `<script setup>`, evita anidar comillas
  simples/dobles en el binding del template) que devuelve el `title` nativo
  del botón cuando aplica, y un `<p class="status status--inline">` visible
  bajo los botones con el mismo mensaje, siguiendo el patrón visual ya usado
  para `ocupadaSinPedidoFor`.
- El caso "venta directa sin pedido abierto" no cambia: esas mesas no
  aparecen en `GET /ventas?estado=abierta`, así que el `Set` no las incluye y
  "Marcar libre" sigue habilitado y funcional igual que antes.
- El manejo de `409` (`onLiberar` → `liberarErrorFor` → `messageFor`) no se
  tocó; sigue siendo la red de seguridad para condiciones de carrera.
- No se tocó `PedidoEnCursoModal.vue` ni ningún contrato de API, según lo
  pedido.

**Verificación manual contra backend real** (`localhost:8000` / `localhost:5173`,
sin levantar otra instancia): se creó un usuario de prueba temporal
(`fe038.test@brainfreeze.local`, vía `app.scripts.crear_usuario`) y dos mesas
de prueba (`FE038-QA-A`, `FE038-QA-B`) para no interferir con datos de otras
tareas QA ya presentes en la base:
  - Mesa A: `POST /ventas/abrir {mesa_id}` → queda `ocupada` con pedido
    `abierta`. Confirmado que aparece en `GET /ventas?estado=abierta` (por lo
    tanto el frontend la marcaría en el `Set` y deshabilitaría "Marcar
    libre" con el tooltip/mensaje, sin llamar al backend).
  - Mesa B: `POST /ventas {mesa_id, metodo_pago, items}` (venta directa,
    `estado: activa`) → queda `ocupada` pero NO aparece en
    `GET /ventas?estado=abierta`; `POST /mesas/8/liberar` respondió `200`
    normalmente (comportamiento sin cambios).
  - `POST /mesas/7/liberar` (mesa con pedido abierto) respondió `409` con el
    mensaje exacto: "No se puede liberar la mesa: tiene un pedido abierto.
    Usa 'Cobrar' o 'Descartar' desde el panel del pedido." — confirma que
    `liberarErrorFor` seguiría mostrándolo igual que hoy.
  - `POST /ventas/21/descartar` → `204`, y la mesa A pasó a `libre`
    automáticamente (confirma que `onPedidoSettled` + `refreshMesasConPedidoAbierto()`
    dejarían de marcarla).
  - Limpieza: se descartó/canceló las ventas de prueba, se eliminaron las
    mesas `FE038-QA-A`/`FE038-QA-B` y el usuario temporal directamente de
    `brainfreeze.db` (la mesa con venta directa cancelada no se podía borrar
    vía API por el guard existente de "tiene ventas asociadas", así que se
    limpió a nivel de fila igual que la venta y el usuario). No se tocaron
    mesas/ventas preexistentes de otras tareas (ej. ventas `abierta`
    huérfanas en mesas `libre` ya presentes antes de esta verificación, no
    creadas por esta tarea).
  - `npx vue-tsc -b` y `npm run build` corren sin errores.

## Revisión

**Veredicto: done**

Código revisado en `frontend/src/views/MesasView.vue`: `mesasConPedidoAbiertoIds`
se pobla con una única llamada `listVentas({ estado: 'abierta' })` (sin
endpoint nuevo), se refresca en `onMounted`, tras `onAbrirMesa` (rama mesa
libre) y en `onPedidoSettled`. El botón "Marcar libre" se deshabilita con
`mesa.estado === 'libre' || liberandoId === mesa.id ||
mesasConPedidoAbiertoIds.has(mesa.id)`, con `title` (`tituloMarcarLibre`) y un
`<p class="status status--inline">` visible con el mensaje guiando a "Ver
pedido". `onLiberar`/`liberarErrorFor` no se tocaron, siguen siendo la red de
seguridad para el `409` de BE-029. Fuera de alcance (`PedidoEnCursoModal.vue`,
chip de estado) confirmado sin cambios.

`npx vue-tsc -b` y `npm run build` corren sin errores (verificado en esta
revisión).

Verificado end-to-end contra backend real (`:8000`) con dos mesas de prueba
(limpiadas al final junto con el usuario temporal, sin tocar datos
preexistentes): `GET /ventas?estado=abierta` incluye el `mesa_id` de la mesa
con pedido abierto (creado vía `/ventas/abrir`) y no incluye el de la mesa con
venta directa (`POST /ventas` con `mesa_id`) — confirma que la lógica del
`Set` en el componente, tal como está escrita, deshabilitaría "Marcar libre"
solo en el primer caso. Tras `descartar`/`cerrar` el pedido, la mesa deja de
aparecer en `GET /ventas?estado=abierta`, por lo que `refreshMesasConPedidoAbierto`
(llamado desde `onPedidoSettled`) la sacaría del `Set` correctamente. No se
disponía de herramienta de navegador en este entorno para clickear la UI
directamente; la verificación se hizo trazando el código exacto del componente
contra las respuestas reales de la API que consume, sin discrepancias.
Todos los criterios de aceptación cumplidos.
