---
id: FE-005
title: Pantalla de Inventario
area: frontend
status: done
priority: medium
depends_on: [FE-001, BE-004]
created_by: planner
---

## Objetivo

Replicar la pantalla "Inventario" del mockup: lista de insumos con stock,
mínimo y estado (OK/Bajo/Crítico) resaltado visualmente (tags de color como
en el mockup), más el contador "N referencias · M con stock bajo o crítico".

## Alcance

- Lee el contrato de `GET /insumos` (incluyendo `estado` calculado) en
  `tasks/backend/BE-004-modelo-inventario.md`.
- Tabla/lista de insumos con tag de color según `estado` (reutiliza los
  tokens de color de FE-001, no hardcodees hex nuevos).
- Acción para ajustar stock (sumar/restar cantidad) usando el endpoint de
  ajuste del backend, no editando el número directamente si el backend no lo
  expone así.
- CRUD de insumos (crear/editar nombre, categoría, mínimo).

## Criterios de aceptación

- [ ] La lista muestra stock, mínimo y estado con el estilo visual correcto
      por color según estado.
- [ ] El contador de "con stock bajo o crítico" coincide con los insumos
      marcados como tal.
- [ ] Ajustar stock (entrada/salida) funciona contra el endpoint dedicado del
      backend.
- [ ] Crear un insumo nuevo lo asocia a una categoría existente.

## Notas de implementación

### Archivos creados/tocados

- `frontend/src/api/types.ts`: se agregaron `EstadoInsumo` (literal
  `'Crítico' | 'Bajo' | 'OK'`, coincide con los valores exactos del enum del
  backend), `Insumo`, `InsumoCreate`, `InsumoUpdate` (sin `stock`, igual que
  `backend/app/schemas/insumo.py`) y `AjusteStock`, confirmados contra el
  backend real con `curl`.
- `frontend/src/api/insumos.ts` (nuevo): `listInsumos(params)` (soporta
  `solo_alertas` aunque la vista no lo usa por ahora, ver decisión abajo),
  `createInsumo`, `updateInsumo` (`PATCH`, sin `stock`), `ajustarStockInsumo`
  (`POST /insumos/{id}/ajustar-stock`), `deleteInsumo`.
- `frontend/src/composables/useInsumos.ts` (nuevo): expone `insumos`,
  `isLoading`, `loadError`, `load()`, `create`/`update`/`remove` (wrappers
  delgados de la API, igual criterio que `useProductos` — la vista decide
  cuándo recargar), y `ajustarStock(id, cantidad)` que sí actualiza
  localmente la entrada (reemplaza el insumo con la respuesta del backend,
  que ya trae `stock`/`estado` recalculados) porque el ajuste no depende de
  ningún filtro activo en la vista.
- `frontend/src/views/InventarioView.vue`: reemplaza el placeholder. Tabla
  con nombre/categoría (vía `useCategorias`, mismo patrón que
  `ProductosView`)/stock/mínimo/estado (tag de color por `estado`), contador
  "N referencias · M con stock bajo o crítico" calculado localmente
  (`computed` sobre `insumos`, cuenta `estado !== 'OK'`), formulario de
  alta/edición (nombre, categoría, stock mínimo — sin campo `stock`, ver
  decisión abajo) y acción "Ajustar stock" por fila que abre una fila
  expandible inline con un input de cantidad (siempre positivo) y dos
  botones explícitos "+ Entrada" / "− Salida" que llaman a
  `POST /insumos/{id}/ajustar-stock` con el delta correspondiente (positivo
  o negativo) — nunca se edita el campo `stock` directamente.

### Decisiones tomadas

- **Tags de color reutilizan tokens existentes de `tokens.css`, sin hex
  nuevos**: `OK` → `--color-lime`, `Crítico` → `--color-danger` (mismos que
  ya usa `MesasView`/`ProductosView` para sus propios estados). Para `Bajo`
  no existe un token "warning/ámbar" dedicado en `tokens.css`; en vez de
  introducir un hex nuevo (que el alcance prohíbe explícitamente: "no
  hardcodees hex nuevos"), se reutilizó `--color-cyan` (ya usado como color
  de acento/link en el resto de la app) para diferenciarlo visualmente de
  `OK` (lime) y `Crítico` (danger). El fondo semitransparente de cada tag
  usa el mismo patrón `rgba(...)` que ya usan `tag--disponible`/
  `mesa-badge--libre` (deriva el rgba del color del token para el
  alpha-blend del fondo, no introduce un color distinto al token).
- **`stock` NO aparece en ningún formulario CRUD, ni siquiera al crear**: el
  alcance dice explícitamente "CRUD de insumos (crear/editar nombre,
  categoría, mínimo)" — no incluye stock inicial en la lista de campos, y
  el criterio central de esta tarea es que el stock nunca se edite como un
  número directo. Aunque `InsumoCreate` del backend acepta `stock` opcional
  (default 0) para fijar un valor inicial, se decidió no exponerlo en el
  formulario de creación para mantener un único camino explícito hacia
  cualquier cambio de stock (la acción "Ajustar stock"), evitando que el
  criterio de aceptación ("no como edición directa del campo stock") tenga
  una puerta trasera en el alta. Un insumo nuevo queda con stock en 0 (el
  default del backend) y se le hace un ajuste de entrada explícito después
  de crearlo; se agregó un texto de ayuda (`hint`) en el formulario de
  creación explicando esto para que no sea sorpresivo.
- **`ajustarStock` recibe siempre una cantidad positiva desde el input y el
  signo lo decide el botón** (`+ Entrada` manda `+cantidad`, `− Salida`
  manda `-cantidad`): más claro para el usuario que pedirle que escriba
  `-5` a mano; internamente se sigue llamando al mismo endpoint con el
  delta con signo que espera `AjusteStock.cantidad`.
- **No se implementó el toggle "solo alertas" en la UI** (aunque
  `listInsumos`/`api/insumos.ts` sí soportan el parámetro `solo_alertas`
  por si una tarea futura lo necesita, ej. un widget de dashboard): el
  alcance de FE-005 no lo pide explícitamente (a diferencia de FE-004, que
  sí exige buscador+filtro de categoría contra la API); el contador de
  alertas se calcula localmente sobre el listado completo, que ya cumple el
  criterio de aceptación tal como está escrito ("el contador... coincide
  con los insumos marcados como tal"). Si el planner quiere el toggle
  explícito en la UI, es una adición pequeña sobre lo ya construido.
- **Acción "Eliminar" agregada por consistencia con `CategoriasView`**,
  mismo razonamiento documentado en las notas de FE-004 (el backend expone
  `DELETE /insumos/{id}` y el alcance lee el contrato completo aunque no
  lo liste explícitamente en los criterios).
- No se agregó ninguna librería nueva; tabla y formulario con HTML nativo,
  igual que el resto de vistas del proyecto.

### Cómo probarlo

1. Backend: `cd backend && ./.venv/Scripts/python -m uvicorn app.main:app --port 8000`,
   con un usuario creado (`python -m app.scripts.crear_usuario email pass`) y
   al menos una categoría creada (desde `/categorias` en el frontend, o
   `POST /categorias`).
2. `cd frontend && npm run dev`, ir a `/inventario`.
3. "+ Nuevo insumo" → nombre "Jarabe Fresa", elegir categoría, mínimo 3 →
   Guardar: aparece en la tabla con stock 0 y estado "Crítico" (`0 <= 0`).
4. "Ajustar stock" sobre esa fila → cantidad 10 → "+ Entrada": el stock pasa
   a 10 y el estado a "OK" sin recargar toda la página.
5. "Ajustar stock" de nuevo → cantidad 8 → "− Salida": stock queda en 2,
   estado pasa a "Bajo" (tag cyan) porque `2 <= stock_minimo(3)`.
6. Intentar una salida mayor al stock disponible (ej. cantidad 999) → se
   muestra el mensaje de error real del backend ("El ajuste dejaría el
   stock en ..., no puede ser negativo") inline en la fila, sin error crudo
   de red.
7. El contador superior refleja "N referencias · M con stock bajo o
   crítico" correctamente tras cada cambio.
8. "Editar" → cambiar el mínimo → Guardar: el estado se recalcula según el
   nuevo mínimo (el campo `stock` no aparece en este formulario).
9. "Eliminar" sobre una fila sin dependencias → desaparece de la tabla.

Verificado en este entorno:
- `npx vue-tsc -b` sin errores.
- `npx vite build` exitoso (`InventarioView-*.js`/`.css` como chunk lazy
  separado).
- Backend real levantado (`uvicorn` en `127.0.0.1:8000`, usuario de prueba
  vía `crear_usuario.py`); se confirmó con `curl` autenticado el shape
  exacto que consume `api/insumos.ts`: `POST /insumos` (estado `OK` y
  `Crítico` según stock/mínimo), `GET /insumos` (orden y shape), `POST
  /insumos/{id}/ajustar-stock` con delta negativo (recalcula stock y estado
  correctamente, confirmado `10.0` → `5.0`), `GET /insumos?solo_alertas=true`
  (devuelve solo el insumo en estado `Crítico`). No se pudo completar una
  prueba interactiva en navegador real dentro de este entorno (sin
  herramienta de control de navegador disponible en esta sesión); la UI se
  validó por código + compilación + el contrato de API confirmado en vivo,
  mismo nivel de verificación aplicado en FE-004. Se recomienda que el
  reviewer haga clic-a-clic en `/inventario` con el backend real levantado,
  en particular el flujo de ajuste de stock (entrada/salida) y el caso de
  error 400 al intentar dejar el stock negativo. Se limpiaron
  `brainfreeze.db`, procesos de `uvicorn`/`vite` de prueba y `dist/` al
  terminar.

## Revisión

**Veredicto: `done`**

Tampoco había herramienta de control de navegador disponible en esta sesión.
Se verificó por compilación real + backend real levantado con `curl`
autenticado reproduciendo el flujo de prueba exacto que documentó el
implementador, más lectura completa de `InventarioView.vue`/`useInsumos.ts`.

- `npx vue-tsc -b` (vía `npm run build`): sin errores. `npx vite build`
  exitoso, `InventarioView` sale como chunk lazy separado.
- Backend real + `curl` reproduciendo el flujo documentado paso a paso:
  1. `POST /insumos {"nombre":"Jarabe Fresa","categoria_id":1,"stock_minimo":3}`
     (sin `stock`) -> `stock: 0.0`, `estado: "Crítico"`. Coincide con el paso
     3 de las notas.
  2. `POST /insumos/{id}/ajustar-stock {"cantidad":10}` -> `stock: 10.0`,
     `estado: "OK"`. Coincide con el paso 4.
  3. `POST /insumos/{id}/ajustar-stock {"cantidad":-8}` -> `stock: 2.0`,
     `estado: "Bajo"`. Coincide con el paso 5.
  4. `POST /insumos/{id}/ajustar-stock {"cantidad":-999}` -> `400
     {"detail":"El ajuste dejaría el stock en -997.0, no puede ser
     negativo"}`. Coincide con el paso 6 (mensaje real del backend, no
     genérico).
  5. `GET /insumos` y `GET /insumos?solo_alertas=true` devolvieron el
     insumo correctamente filtrado por estado.
  6. `PATCH /insumos/{id} {"stock_minimo":1}` recalculó el estado a `"OK"`
     sin tocar `stock`. Coincide con el paso 8.
  7. **Prueba adicional propia**: `PATCH /insumos/{id} {"stock":9999}` — el
     backend lo ignora silenciosamente (`InsumoUpdate` no tiene ese campo),
     el `stock` no cambió. Esto confirma en el contrato real de API — no
     solo en el formulario del frontend — que no existe ninguna puerta
     trasera para editar `stock` directamente, ni siquiera si alguien
     manipulara el payload manualmente contra este backend.
  8. `POST /insumos` con `categoria_id` inexistente -> `404`.
     `DELETE /insumos/{id}` sin dependencias -> `204`.
- Revisión de `InventarioView.vue`: confirmé línea por línea que el campo
  `stock` no aparece en ningún `<input>`/`v-model` del formulario de
  alta/edición (`form` solo tiene `nombre`, `categoria_id`,
  `stock_minimo`), y que el único camino para modificar `stock` es la fila
  expandible con botones `+ Entrada`/`− Salida` (`onAjustar`, líneas
  124-142) que llaman a `ajustarStock` con el delta con signo correcto
  según el botón. Esto cumple realmente la regla de negocio "stock nunca se
  edita directo", verificado tanto en el frontend como en el backend.
- Tags de color: `--color-lime` (OK), `--color-cyan` (Bajo, `rgba(0, 229,
  255, 0.14)` — confirmé que ese RGB corresponde exactamente al valor hex
  `#00e5ff` de `--color-cyan` en `tokens.css`, no es un hex inventado),
  `--color-danger` (Crítico). Cumple "no hardcodees hex nuevos".
- Sin `any` (los `step="any"` encontrados son el atributo HTML nativo de
  `<input type="number">`, no el tipo TS), sin `v-html`/`innerHTML`, estados
  de carga/error manejados explícitamente, errores de ajuste de stock
  mostrados inline por fila (`ajusteErrorFor`) en vez de un alert genérico.
- Contador "N referencias · M con stock bajo o crítico": `computed` sobre
  `insumos.value` contando `estado !== 'OK'` — matemáticamente correcto y
  reactivo a cualquier cambio de `insumos` (incluida la actualización local
  tras un ajuste de stock).

No se encontraron hallazgos que bloqueen esta tarea. Todas las decisiones
documentadas (stock fuera de los formularios CRUD, color cyan reutilizado
para "Bajo", sin toggle de "solo alertas" en la UI, acción "Eliminar"
agregada) están dentro del alcance y bien justificadas.
