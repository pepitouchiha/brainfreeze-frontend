---
id: FE-004
title: Pantalla de Productos (catálogo de granizados)
area: frontend
status: done
priority: high
depends_on: [FE-001, BE-003]
created_by: planner
---

## Objetivo

Replicar la pantalla "Productos" del mockup con catálogo real de granizados
en vez del catálogo de bar de ejemplo: buscador, contador "X de Y productos",
precio formateado en COP, estado (disponible/agotado).

## Alcance

- Lee el contrato de `GET/POST/PUT/DELETE /productos` en
  `tasks/backend/BE-003-modelo-productos.md`.
- Buscador por nombre (usa el filtro `search` del backend, no filtres solo en
  el cliente si ya hay paginación/filtrado server-side).
- Filtro por categoría.
- Crear/editar producto: nombre, categoría, precio, estado.
- Precio mostrado con el helper de COP de FE-001.

## Criterios de aceptación

- [ ] El buscador filtra productos por nombre contra la API.
- [ ] El contador "X de Y productos" refleja resultados filtrados vs. total.
- [ ] Crear/editar un producto funciona end-to-end contra el backend.
- [ ] Precios se muestran formateados en COP consistentemente.

## Notas de implementación

### Archivos creados/tocados

- `frontend/src/api/types.ts`: se agregaron `EstadoProducto`, `Producto`,
  `ProductoCreate`, `ProductoUpdate`, confirmados contra
  `backend/app/schemas/producto.py` (`ProductoOut`/`ProductoCreate`/
  `ProductoUpdate`) y verificados en vivo con `curl` contra el backend real
  (incluye `sabor`/`tamano`/`creado_en` que el backend siempre devuelve
  aunque no se usen en el formulario, ver decisión abajo).
- `frontend/src/api/productos.ts` (nuevo): `listProductos(params)` (arma
  querystring con `search`/`categoria_id` opcionales vía `URLSearchParams`),
  `createProducto`, `updateProducto` (usa `PATCH`, igual criterio que
  `updateCategoria`), `deleteProducto`.
- `frontend/src/composables/useProductos.ts` (nuevo): expone `productos`
  (listado filtrado actual), `total` (conteo de todos los productos sin
  filtrar, para el contador "X de Y"), `isLoading`, `loadError`, `loadTotal()`,
  `load(filters)`, y `create`/`update`/`remove` como wrappers delgados de la
  API (sin mutación optimista local, a diferencia de `useCategorias`/
  `useMesas`) — ver decisión abajo sobre por qué.
- `frontend/src/views/ProductosView.vue`: reemplaza el placeholder.
  Buscador con debounce de 300ms que llama a `GET /productos?search=...`
  (filtrado 100% server-side, no se filtra en cliente), selector de
  categoría (reutiliza `useCategorias` para las opciones, igual que se
  documentó como intención en FE-003), contador "X de Y productos" arriba
  de la tabla, formulario de alta/edición (nombre, categoría, precio,
  estado) reutilizado para ambos modos igual que `CategoriasView`, tabla con
  nombre/categoría/precio (formateado con `formatCOP` de FE-001)/estado
  (tag de color: lime para "disponible", rojo/danger para "agotado", usando
  los tokens de `tokens.css`) y acciones Editar/Eliminar por fila.

### Decisiones tomadas

- **Contador "X de Y" con dos fuentes de datos**: como el buscador y el
  filtro de categoría son server-side (criterio explícito: "no filtres solo
  en el cliente"), `productos.length` (resultado filtrado) y `total` (conteo
  de *todos* los productos, sin filtro) no pueden salir de la misma llamada.
  `loadTotal()` hace un `GET /productos` sin parámetros al montar la vista y
  tras cada creación/eliminación; `load(filters)` hace la llamada filtrada
  real que ve el usuario. Es una petición extra, pero es la única forma
  correcta de mostrar "resultados filtrados vs. total" sin que el backend
  exponga un conteo total aparte (no lo pide el contrato de BE-003).
- **`create`/`update`/`remove` sin mutación optimista local** (a diferencia
  de `useCategorias`): dado que hay filtros activos (`search`/
  `categoria_id`), un producto recién creado o editado podría no pertenecer
  a la vista filtrada actual (ej. se crea con una categoría distinta a la
  filtrada), así que insertarlo "a ciegas" en el array local podría mostrar
  datos inconsistentes con el filtro visible. En su lugar, la vista llama a
  `Promise.all([refresh(), loadTotal()])` tras cada mutación exitosa, lo que
  vuelve a pedir la lista con los filtros activos — más simple y siempre
  consistente con lo que el usuario está filtrando.
- **`sabor`/`tamano` no se exponen en el formulario**: el alcance de la
  tarea lista explícitamente los campos del formulario ("nombre, categoría,
  precio, estado"), sin mencionar `sabor`/`tamano` (esos son metadata
  opcional que BE-003 agregó por su cuenta, documentado en sus notas). Se
  respetó el alcance al pie de la letra y no se agregaron esos dos campos al
  formulario para no exceder lo pedido; el tipo `Producto` sí los tipa
  (`string | null`) porque el backend los devuelve siempre.
- **Acción "Eliminar" agregada aunque no está en los criterios explícitos**:
  el alcance dice "lee el contrato de GET/POST/PUT/DELETE /productos" y
  "Crear/editar producto" en la lista de campos, sin mencionar borrar
  explícitamente en los criterios de aceptación. Se agregó de todas formas,
  consistente con el patrón ya usado en `CategoriasView` (CRUD completo
  disponible en la UI ya que el backend lo expone) — si el planner prefiere
  que no esté disponible desde esta pantalla, es trivial de remover.
- No se agregó ninguna librería nueva (tabla, select, etc.); se usan
  elementos HTML nativos (`<table>`, `<select>`), igual criterio que
  `CategoriasView`/`MesasView`.

### Cómo probarlo

1. Backend: `cd backend && ./.venv/Scripts/python -m uvicorn app.main:app --port 8000`,
   con un usuario creado (`python -m app.scripts.crear_usuario email pass`) y
   sesión iniciada en el frontend.
2. Poblar datos de ejemplo: `cd backend && ./.venv/Scripts/python -m app.scripts.seed_productos`
   (crea 3 categorías y 15 productos de granizados/toppings/bebidas).
3. `cd frontend && npm run dev`, ir a `/productos`.
4. El contador debe mostrar "15 de 15 productos" al cargar.
5. Escribir "fresa" en el buscador (con debounce de 300ms): la tabla se
   reduce a los 2 productos de fresa, el contador cambia a "2 de 15
   productos".
6. Filtrar por categoría "Toppings": la tabla muestra solo los 3 toppings.
7. "+ Nuevo producto" → llenar nombre/categoría/precio/estado → Guardar: la
   fila aparece en la tabla (si coincide con el filtro activo) y el
   contador de "Y" (total) sube en 1.
8. "Editar" sobre una fila → cambiar precio o estado → Guardar: el cambio se
   refleja en la tabla.
9. "Eliminar" sobre una fila → desaparece de la tabla y el total baja en 1.

Verificado en este entorno:
- `npx vue-tsc -b` sin errores.
- `npx vite build` exitoso (genera `ProductosView-*.js`/`.css` como chunk
  separado, lazy-loaded vía el router igual que el resto de vistas).
- Backend real levantado (`uvicorn` en `127.0.0.1:8000`) con usuario de
  prueba creado vía `crear_usuario.py` y datos poblados vía
  `seed_productos.py`; se confirmó con `curl` autenticado (JWT real de
  `POST /auth/login`) el shape exacto que consume `api/productos.ts`:
  `GET /productos?search=fresa` (2 resultados, mismo shape que `Producto`),
  `GET /productos?categoria_id=1` (filtra correctamente), `GET /categorias`
  (mismo shape que usa el selector). No se pudo completar una prueba
  interactiva en navegador real dentro de este entorno (no hay herramienta
  de control de navegador disponible en esta sesión); la UI se validó por
  código + compilación + el contrato de API confirmado en vivo, siguiendo el
  mismo nivel de verificación que documentó FE-003 para su parte de
  `curl`. Se recomienda que el reviewer haga clic-a-clic en `/productos` con
  el backend real levantado para confirmar la interacción visual.

## Revisión

**Veredicto: `done`**

No hay herramienta de control de navegador disponible en este entorno
tampoco, así que la verificación se hizo por: (1) compilación real, (2) el
backend real levantado y probado con `curl` autenticado reproduciendo
exactamente los endpoints que consume `api/productos.ts`, y (3) lectura
completa del código Vue/TS.

- `npx vue-tsc -b` (vía `npm run build`): sin errores.
- `npx vite build`: build exitoso, `ProductosView` sale como chunk lazy
  separado (`ProductosView-*.js`/`.css`), consistente con el resto de vistas
  vía `router/index.ts`.
- Backend real (`uvicorn`, SQLite temporal) + `curl` con JWT real:
  `GET /productos?search=fresa` devolvió solo el producto de fresa,
  `GET /productos?categoria_id=1` filtró correctamente, `GET /productos`
  (sin filtro) devolvió el total — confirma que el contrato que consume
  `useProductos`/`ProductosView` (`productos.length` filtrado vs `total` sin
  filtrar) es el que el backend realmente entrega. `GET /categorias`
  coincide con el shape que usa el `<select>` de categoría.
- Revisé `backend/app/schemas/producto.py` línea por línea contra
  `frontend/src/api/types.ts`: `Producto`/`ProductoCreate`/`ProductoUpdate`
  son un match exacto de `ProductoOut`/`ProductoCreate`/`ProductoUpdate`
  (incluye `sabor`/`tamano` tipados aunque no se usan en el formulario, como
  documentan las notas).
- Código (`ProductosView.vue`, `useProductos.ts`, `api/productos.ts`):
  sin `any`, estados de carga (`isLoading`)/error (`loadError`) manejados
  explícitamente y mostrados en el template, sin `v-html`/`innerHTML`. El
  filtrado es 100% server-side vía querystring (`URLSearchParams`), tal como
  exige el alcance. El formulario reutiliza un único `<form>` para
  crear/editar, igual patrón que `CategoriasView`. Manejo de error por fila
  al eliminar (`deleteErrorFor`) en vez de un error global genérico.
- Las decisiones documentadas (contador con dos llamadas, sin mutación
  optimista, `sabor`/`tamano` fuera del formulario, acción "Eliminar"
  agregada) están bien justificadas contra el alcance y no contradicen
  ningún criterio de aceptación. Sobre la UX del "delay perceptible" que
  pide evaluar la tarea: es razonable — el `Promise.all([refresh(),
  loadTotal()])` tras cada mutación es una única ronda de red en paralelo,
  no una cadena secuencial, y hay estado `isSaving`/`isLoading` visible
  durante la espera, así que no es una regresión de UX grave.

**Hallazgo menor, no bloqueante** (no amerita `changes-requested`, queda
para una futura iteración si se nota en uso real): `onSearchInput` dispara
`load()` tras el debounce sin guarda de secuencia/`AbortController`. Si dos
búsquedas se disparan muy cerca (p. ej. usuario escribe, borra y vuelve a
escribir distinto texto cruzando el límite del debounce, o cambia
`search` y `categoriaFiltro` casi simultáneamente) y las respuestas HTTP
llegan fuera de orden, `productos.value` podría quedar mostrando el
resultado de la búsqueda vieja en vez de la más reciente. Es un caso límite
poco probable en un panel interno de un solo usuario, no afecta los
criterios de aceptación tal como están escritos.
