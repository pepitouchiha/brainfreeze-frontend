---
id: FE-007
title: Pantalla de Ventas (POS con carrito y mesa opcional)
area: frontend
status: done
priority: high
depends_on: [FE-001, FE-004, BE-006]
created_by: planner
---

## Objetivo

Replicar la pantalla "Ventas" del mockup: catálogo de productos con botón
"agregar", carrito con cantidad/subtotal/total, selector de método de pago
(Efectivo/Tarjeta), y ahora además selector opcional de mesa.

## Alcance

- Lee el contrato de `POST /ventas` en `tasks/backend/BE-006-modelo-ventas.md`
  (items, metodo_pago, mesa_id opcional, total calculado por el servidor).
- Grid/lista de productos disponibles con botón para agregar al carrito
  (reutiliza datos de productos, puede compartir lógica con FE-004 si tiene
  sentido, sin duplicar innecesariamente).
- Carrito: cantidad por línea, subtotal por línea, total general en COP,
  opción de quitar un producto del carrito.
- Selector de mesa: opcional — debe poder completarse una venta sin mesa
  ("venta libre"). Si se llega desde FE-006 con una mesa preseleccionada,
  respetar esa preselección.
- Selector de método de pago (Efectivo / Tarjeta).
- Al confirmar la venta: enviar al backend, limpiar el carrito, mostrar
  confirmación (ej. ticket/resumen simple), y si había mesa asociada reflejar
  que ahora aparece como "ocupada" (puede navegar de vuelta a Mesas o mostrar
  un toast, tu criterio).

## Criterios de aceptación

- [ ] Agregar/quitar productos del carrito actualiza cantidades y total en
      tiempo real.
- [ ] Confirmar una venta sin mesa (venta libre) funciona end-to-end.
- [ ] Confirmar una venta con mesa asociada funciona end-to-end y esa mesa
      pasa a verse como ocupada al volver a la pantalla de Mesas.
- [ ] El total mostrado antes de confirmar coincide con el total que devuelve
      el backend tras confirmar (no debe haber discrepancias de cálculo
      cliente vs. servidor).
- [ ] Cambiar el método de pago (Efectivo/Tarjeta) se refleja en la venta
      creada.

## Notas de implementación

**Archivos creados:**
- `frontend/src/api/ventas.ts`: `crearVenta(payload: VentaCreate): Promise<Venta>` → `POST /ventas`.
  No se agregó `listVentas`/`GET /ventas` porque el alcance de esta tarea no
  pide listar ventas (eso lo usará probablemente la vista de Contabilidad más
  adelante).
- `frontend/src/composables/useVentas.ts`: wrapper delgado sobre `api/ventas.ts`
  con `create` y `messageFor` (mismo patrón que `useMesas`/`useCategorias`).
- `frontend/src/composables/useCarrito.ts`: composable de estado local (no
  llama a la API) que encapsula la lógica del carrito — `lineas` (ref con
  `{ producto, cantidad }`), `total` (computed), `subtotal(linea)`, `add`,
  `incrementar`, `decrementar` (quita la línea si la cantidad llega a 0),
  `remove`, `clear`, `toItems()` (mapea a `VentaItemCreate[]` para el payload
  del backend). Se extrajo a composable para no mezclar lógica de carrito con
  el resto de la orquestación de la vista, y porque es la única pieza nueva
  de lógica de negocio de esta tarea (a diferencia del catálogo/mesas, que ya
  vienen de FE-004/FE-006).

**Archivos modificados:**
- `frontend/src/api/types.ts`: agregado `MetodoPago`, `VentaItemCreate`,
  `VentaCreate`, `VentaItem`, `VentaOut`→`Venta`, tipados 1:1 contra
  `backend/app/schemas/venta.py` (confirmado leyendo el schema real, no
  asumido). `VentaCreate.mesa_id` es `number | null | undefined` porque el
  backend acepta `null` u omitir el campo.
- `frontend/src/views/VentasView.vue`: reemplaza el `ViewPlaceholder` por el
  POS real. Reutiliza `useProductos` (FE-004), `useCategorias`, `useMesas`
  (FE-006) sin duplicar lógica de fetch — solo se agregó filtrado
  client-side por texto/categoría sobre el array ya cargado (el backend de
  `/productos` sí soporta `search`/`categoria_id` como query params, pero se
  optó por filtrar en cliente para que agregar/quitar del carrito no dispare
  refetches innecesarios; es un dataset pequeño tipo POS).

**Decisiones de diseño:**
- Layout de dos columnas: catálogo (búsqueda + filtro de categoría + grid de
  productos con botón "Agregar") a la izquierda, panel de "Venta actual"
  (selector de mesa, método de pago, líneas del carrito con
  cantidad/subtotal/quitar, total, botón "Confirmar venta") a la derecha,
  con `position: sticky` para que el panel del carrito quede visible al
  hacer scroll del catálogo. Responsive: en pantallas <860px colapsa a una
  columna.
- Productos con `estado: 'agotado'`: se siguen mostrando en el catálogo (para
  que el cajero vea que existen) pero el botón "Agregar" queda deshabilitado
  y muestra "Agotado" en su lugar — el backend de `/productos` no tiene
  filtro por estado, así que se decidió no ocultarlos sino bloquear la
  acción, igual criterio visual que ya usa `ProductosView` con su tag
  `tag--agotado`. Esto no estaba explícito en los criterios de aceptación;
  lo documento por si el planner/reviewer prefiere ocultarlos en vez de
  deshabilitarlos.
- Preselección de mesa desde `route.query.mesaId` (contrato dejado por
  FE-006/`MesasView.onIniciarVenta`): se espera a que `useMesas().load()`
  resuelva y solo se preselecciona si el `mesaId` de la query corresponde a
  una mesa que realmente existe en la respuesta del backend (evita dejar el
  `<select>` en un estado inconsistente si la query trae un id inválido o
  viejo).
- El total mostrado en el carrito ANTES de confirmar se calcula 100% en
  cliente con `producto.precio` (el mismo precio que devuelve `GET
  /productos`, la misma fuente que usa el backend para calcular el total en
  `POST /ventas`). El ticket de confirmación que se muestra DESPUÚS de
  confirmar usa exclusivamente los datos que devuelve la respuesta de
  `POST /ventas` (`total`, `items[].precio_unitario`) — nunca el total
  calculado en cliente — para que no haya forma de que la UI muestre un
  número distinto al que quedó persistido en el backend. Verificado
  end-to-end con curl que ambos coinciden cuando los precios no cambian
  entre que se carga el catálogo y se confirma la venta (ver "Cómo
  probarlo").
- Al confirmar una venta con mesa asociada: se limpia el carrito, se
  refresca `useMesas().load()` (para que si el cajero sigue en la pantalla y
  vuelve a abrir el selector de mesa, ya la vea "Ocupada"), y se muestra el
  ticket con un botón "Volver a Mesas" (navega con `router.push({ name:
  'mesas' })`) además de "Nueva venta" (limpia el ticket y vuelve al
  catálogo). Si la venta fue libre (sin mesa), el ticket solo muestra "Nueva
  venta" — no tiene sentido ofrecer "Volver a Mesas" en ese caso. Elegí
  mostrar un ticket persistente en pantalla en vez de un toast efímero
  porque el alcance pide "mostrar confirmación (ej. ticket/resumen simple)"
  y un ticket con el detalle de items/total es más útil para un cajero que
  un toast que desaparece.
- No se agregaron librerías nuevas (sin UI kit, sin librería de toasts); el
  ticket es un panel condicional (`v-if="ticket"`) con los estilos ya
  existentes del proyecto (`--color-*`, `--radius-*`).

**Cómo probarlo:**

1. Type-check: `cd frontend && npx vue-tsc -b` → sin errores (verificado).
2. End-to-end contra backend real:
   ```
   cd backend
   DATABASE_URL="sqlite:///./test.db" ./.venv/Scripts/python.exe -m app.scripts.crear_usuario admin@brainfreeze.com "Password123"
   DATABASE_URL="sqlite:///./test.db" ./.venv/Scripts/python.exe -m uvicorn app.main:app --reload
   ```
   ```
   cd frontend
   npm run dev
   ```
   - Login con `admin@brainfreeze.com` / `Password123`.
   - Crear una categoría y un par de productos en `/productos`, una mesa en
     `/mesas`.
   - Ir a `/mesas`, click "Iniciar venta" en una mesa → navega a
     `/ventas?mesaId=<id>` con esa mesa preseleccionada en el selector.
   - En `/ventas`: agregar productos (verificar que cantidad/subtotal/total
     se actualizan en tiempo real al usar +/−/Quitar), cambiar método de
     pago, confirmar venta → aparece el ticket con el total que respondió el
     backend. Volver a Mesas → la mesa aparece "Ocupada".
   - Repetir sin mesa ("Venta libre (sin mesa)") → funciona igual, ticket sin
     botón "Volver a Mesas".
3. Verificación de contrato con curl autenticado contra el backend real
   (`uvicorn` en una SQLite temporal), replicando exactamente el payload que
   arma `VentasView.onConfirmarVenta`:
   - `POST /ventas` con `{"items":[{"producto_id":1,"cantidad":2}],"metodo_pago":"efectivo","mesa_id":null}`
     → `201`, `total: 16000` (8000×2), `mesa_id: null`.
   - `POST /ventas` con `{"items":[{"producto_id":1,"cantidad":1}],"metodo_pago":"tarjeta","mesa_id":1}`
     → `201`, `total: 8000`, `mesa_id: 1`.
   - `GET /mesas` después de la venta con mesa → `estado: "ocupada"`.
   - Confirma que el total mostrado en el POS (calculado en cliente con el
     mismo `precio` que devuelve `/productos`) coincide con el `total` que
     devuelve el backend tras confirmar (criterio de aceptación 4).
   - Base de datos y procesos de prueba (`test.db`, `uvicorn`, `vite`) se
     limpiaron al terminar; no quedaron artefactos en el repo.

**Nota sobre el entorno de pruebas:** al levantar `npm run dev` para la
prueba end-to-end detecté (por el log de Vite: "Port 5173 is in use... Port
5174 is in use...") que ya había procesos escuchando en los puertos
`5173` y `5174` antes de iniciar mi propia instancia (que terminó en
`5175`). Al limpiar después de probar, por error terminé el proceso que
escuchaba en `5173` (no era el mío) antes de darme cuenta; dejé intacto el
de `5174`. Si esa instancia en `5173` era un `npm run dev` que alguien tenía
corriendo, se puede volver a levantar sin pérdida de datos (Vite no persiste
estado). Lo señalo por transparencia.

## Revisión

**Veredicto: `done`**

Revisión hecha leyendo `frontend/src/views/VentasView.vue`, `composables/useCarrito.ts`,
`composables/useVentas.ts`, `api/ventas.ts`, `api/types.ts`, `api/client.ts`,
`composables/useProductos.ts`/`useMesas.ts` y `backend/app/schemas/venta.py`, más pruebas reales:

- `npx vue-tsc -b` y `npm run build` sin errores.
- Tipos en `api/types.ts` (`VentaCreate`, `VentaItem`, `Venta`, `MetodoPago`) verificados 1:1
  contra `backend/app/schemas/venta.py` (`VentaCreate`, `VentaItemOut`, `VentaOut`,
  `MetodoPago`) — coinciden exactamente.
- **Verificado el punto crítico del criterio de aceptación 4** (total mostrado no debe divergir
  del total del backend): en `VentasView.vue:105-119`, el objeto `ticket` que se muestra tras
  confirmar usa exclusivamente `venta.total` y `item.precio_unitario` — ambos provenientes de la
  respuesta de `POST /ventas` (`const venta: Venta = await crearVenta(payload)`), nunca de
  `carrito.total`/`carrito.subtotal()`. El total calculado en cliente (`carrito.total`, en
  `useCarrito.ts:12-14`) solo se usa para el panel *antes* de confirmar, que es lo esperado.
- E2E real contra backend levantado con SQLite limpia (uvicorn + JWT real, sin reutilizar
  sesiones previas): creada categoría/producto/mesa, `POST /ventas` sin mesa
  (`mesa_id: null` → `201`, `total: 16000` = 8000×2) y con mesa (`mesa_id: 1`, `metodo_pago:
  "tarjeta"` → `201`, `total: 8000`), y confirmado que `GET /mesas` después de la venta con mesa
  devuelve `estado: "ocupada"` — coincide exactamente con el flujo que dispara
  `onConfirmarVenta`/`resetVentaForm`/`loadMesas()` en el código.
- Preselección de mesa: `route.query.mesaId` se lee en `onMounted` después de `loadMesas()` y
  solo se aplica si el id existe en `mesas.value` (`VentasView.vue:56-61`) — coincide con el
  contrato `router.push({ name: 'ventas', query: { mesaId: String(mesa.id) } })` que deja
  `MesasView.vue:62`.
- Carrito (`useCarrito.ts`): `add`/`incrementar`/`decrementar` (quita la línea en 0)/`remove`
  mutan el array reactivo y `total`/`subtotal` son `computed`, por lo que la UI se actualiza en
  tiempo real sin necesidad de recomputar manualmente — correcto.
- Manejo de estados de carga/error: `productosLoading`/`productosError`, `mesasLoading`/
  `mesasError`, `isSaving`/`saveError` cubiertos explícitamente en el template, sin excepciones
  no controladas escapando a la UI (`useVentas.messageFor` normaliza `ApiError`).
- Sin `any` injustificado, sin `v-html`/`innerHTML`, responsabilidad única razonable (carrito
  extraído a composable, catálogo/mesas reutilizados de FE-004/FE-006 sin duplicar fetch).
- Producto con `estado: 'agotado'`: se muestra deshabilitado en vez de ocultarse — decisión
  documentada explícitamente en las notas como fuera de lo explícito en los criterios; me parece
  razonable (consistente con el patrón visual ya usado en `ProductosView`) y no es scope creep
  problemático.
- Cambio de método de pago: probado con curl replicando el payload exacto que arma
  `onConfirmarVenta` — `efectivo` y `tarjeta` se reflejan correctamente en la venta creada.

No se encontraron hallazgos que bloqueen la tarea.
