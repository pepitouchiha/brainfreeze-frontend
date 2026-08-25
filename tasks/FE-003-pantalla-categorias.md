---
id: FE-003
title: Pantalla de Categorías
area: frontend
status: done
priority: medium
depends_on: [FE-001, BE-002]
created_by: planner
---

## Objetivo

Replicar la pantalla "Categorías" del mockup: tarjetas/lista de categorías
con su color y el conteo de productos asociados.

## Alcance

- Lee el contrato de `GET/POST/PUT/DELETE /categorias` en
  `tasks/backend/BE-002-modelo-categorias.md`.
- Listado de categorías con nombre, color y `productos_count`.
- Crear / editar / eliminar categoría desde la UI, con selector de color.
- Al intentar eliminar una categoría con productos/insumos asociados, mostrar
  el error que devuelve el backend (409) de forma clara en vez de un error
  genérico.

## Criterios de aceptación

- [ ] La lista de categorías se carga desde la API y muestra conteo de
      productos.
- [ ] Se puede crear una categoría nueva con nombre y color.
- [ ] Editar nombre/color de una categoría existente funciona y refleja el
      cambio sin recargar toda la página.
- [ ] Intentar borrar una categoría con productos asociados muestra un
      mensaje de error entendible, no un error crudo de red.

## Notas de implementación

### Archivos creados/tocados

- `frontend/src/api/types.ts`: se agregaron `Categoria`, `CategoriaCreate`,
  `CategoriaUpdate` confirmados contra `backend/app/schemas/categoria.py`
  (`CategoriaOut`, `CategoriaCreate`, `CategoriaUpdate`).
- `frontend/src/api/categorias.ts` (nuevo): `listCategorias`,
  `createCategoria`, `updateCategoria` (usa `PATCH /categorias/{id}` — el
  backend soporta también `PUT`, pero `PATCH` es semánticamente correcto
  para la edición parcial de nombre/color que hace el formulario) y
  `deleteCategoria`.
- `frontend/src/composables/useCategorias.ts` (nuevo): encapsula el estado
  (`categorias`, `isLoading`, `loadError`) y las operaciones CRUD, con
  actualización optimista del array local tras crear/editar/eliminar (no
  se vuelve a pedir todo el listado tras cada mutación, solo se actualiza
  la entrada afectada — así se cumple "refleja el cambio sin recargar toda
  la página"). Expone `messageFor(err, fallback)` para extraer el mensaje
  legible de un `ApiError` (usa `err.message`, que `api/client.ts` ya llena
  con el campo `detail` que manda FastAPI, ej. en el 409 de nombre
  duplicado o de categoría con productos/insumos asociados) con un mensaje
  genérico de respaldo si el error no trae `detail`. Se dejó como
  composable (no lógica embebida en la vista) pensando en que FE-004
  (Productos) probablemente necesite el mismo listado de categorías para un
  selector.
- `frontend/src/views/CategoriasView.vue`: reemplaza el placeholder.
  Listado en grid de tarjetas (swatch de color + nombre + `productos_count`),
  formulario de alta/edición (mismo formulario reutilizado para ambos modos,
  toggle por `editingId`) con input `nombre` e `<input type="color">` nativo
  para el selector de color (no se agregó ninguna librería de color picker,
  consistente con la regla de no sumar dependencias no pedidas). Cada
  tarjeta tiene "Editar" (abre el formulario precargado) y "Eliminar" (con
  estado de carga por tarjeta vía `deletingId`); si el `DELETE` falla
  (409 por productos/insumos asociados), el mensaje del backend se muestra
  inline en esa tarjeta específica (`deleteErrorFor[categoria.id]`) en vez
  de un alert genérico o un error de red crudo.

### Decisiones tomadas

- No se implementó un modal ni una librería de UI: el formulario se muestra
  inline arriba del listado (toggle simple), consistente con "no agregar
  librerías nuevas si la tarea no las pide".
- El color por defecto del formulario de creación es `#6b7280`, igual al
  default que usa el backend (`COLOR_DEFAULT` en
  `backend/app/models/categoria.py`) cuando no se manda `color` — así la UI
  y el backend no divergen si el usuario no toca el selector.
- El listado se ordena por nombre en el cliente tras cada mutación local
  (`localeCompare`), igual que el backend ordena `GET /categorias` por
  `nombre` — mantiene el orden estable sin depender de otro round-trip a
  la API.

### Cómo probarlo

1. Backend: `cd backend && .\.venv\Scripts\python -m uvicorn app.main:app --port 8000`
   (con usuario creado, ver FE-002) y sesión iniciada en el frontend.
2. Ir a `/categorias`: lista vacía al inicio ("Todavía no hay categorías
   creadas.").
3. "+ Nueva categoría" → nombre "Granizados", elegir color → Guardar: la
   tarjeta aparece sin recargar la página.
4. "Editar" sobre esa tarjeta → cambiar color/nombre → Guardar: la tarjeta
   refleja el cambio in-place.
5. Crear una categoría con el mismo nombre que otra existente → el
   formulario muestra "Ya existe una categoría con ese nombre" (409 real del
   backend, verificado con `curl` en este entorno).
6. Eliminar una categoría sin productos asociados → desaparece de la lista.
   (El caso de bloqueo 409 por productos/insumos asociados no se pudo
   ejercitar end-to-end vía UI real porque BE-003/BE-004 [Productos/
   Inventario] todavía no existen — no hay forma de crear un producto
   asociado a una categoría en este momento. El manejo de ese 409 sí está
   implementado y usa el mismo mecanismo genérico de `messageFor`
   verificado con el 409 de nombre duplicado; cuando BE-003 exista se puede
   confirmar el caso completo).

Verificado en este entorno: `npx vue-tsc -b` sin errores. Backend real
levantado y probado con `curl` de punta a punta: crear (201), listar (200),
duplicado (409 con el mensaje que consume la UI), editar por `PATCH` (200),
eliminar (204) — todos con el token real de `POST /auth/login`.

## Revisión

**Veredicto: `done`**

Verificado con `npx vue-tsc -b` y `npx vite build` sin errores, y con
backend real levantado (probado end-to-end contra `/categorias` en la
revisión conjunta de BE-003/BE-004: crear, listar, 409 por nombre duplicado,
editar por `PATCH`, eliminar, y bloqueo 409 por productos/insumos asociados
— todos con el shape exacto que consume `api/categorias.ts`/`useCategorias.ts`).

Revisión de código:

- `api/types.ts`: `Categoria`/`CategoriaCreate`/`CategoriaUpdate` coinciden
  exactamente con `backend/app/schemas/categoria.py`.
- `useCategorias.ts`: actualización optimista local tras cada mutación (no
  vuelve a pedir todo el listado), cumpliendo "refleja el cambio sin
  recargar toda la página". `messageFor` extrae `err.message` de `ApiError`
  (que ya trae el `detail` del backend) con fallback genérico — es el
  mecanismo correcto para mostrar el 409 de forma legible en vez de un error
  crudo.
- `CategoriasView.vue`: usa `<input type="color">` nativo, sin librería
  adicional — razonable y consistente con no sumar dependencias no pedidas.
  El error de `DELETE` (409) se muestra inline por tarjeta
  (`deleteErrorFor[categoria.id]`), cumpliendo el criterio explícito de "no
  un error genérico". Estados de carga (`isLoading`, `isSaving`,
  `deletingId`) manejados explícitamente.

Sobre la limitación documentada de pruebas ("el bloqueo 409 por
productos/insumos asociados no se pudo ejercitar end-to-end vía UI real
porque BE-003/BE-004 no existían"): ya no aplica — como parte de la revisión
de BE-003/BE-004 (hecha en la misma sesión) confirmé con `curl` real que
`DELETE /categorias/{id}` con productos/insumos asociados devuelve 409 con
un `detail` legible, y el mecanismo que usa esta pantalla (`messageFor` →
`err.message` desde `ApiError`) es el mismo que ya se validó con el 409 de
nombre duplicado. No requiere cambios de código.

No se encontró `any` injustificado ni acceso a `innerHTML`/`v-html`.
Consistente con la estructura del resto del proyecto (mismo patrón de
composable + vista que `useMesas`/`MesasView`).

Todos los criterios de aceptación se cumplen.
