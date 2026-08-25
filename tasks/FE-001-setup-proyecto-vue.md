---
id: FE-001
title: Setup inicial del proyecto Vue 3 + TypeScript
area: frontend
status: done
priority: high
depends_on: []
created_by: planner
---

## Objetivo

Dejar listo el esqueleto del frontend para que el resto de pantallas
(login, productos, categorías, inventario, mesas, ventas, dashboard) se
construyan sobre una base consistente.

## Alcance

- Proyecto Vue 3 + TypeScript con Vite.
- Vue Router con rutas para: login, dashboard, inventario, productos,
  categorías, ventas, mesas, contabilidad — replicando la navegación lateral
  del mockup (`Brainfreezee Panel (offline).html`, revísalo con Grep acotado
  si necesitas confirmar textos/iconos exactos, no lo cargues completo con
  Read).
- Guard de ruta simple: si no hay sesión/token, redirige a login (la
  integración real con BE-008 llega en FE-002; aquí solo deja el mecanismo).
- Cliente HTTP tipado hacia el backend (ej. wrapper sobre `fetch` o `axios`
  con tipos TypeScript de request/response), con la URL base configurable por
  variable de entorno (`VITE_API_URL` o similar) — no hardcodees `localhost`.
- Tema visual: fondo oscuro con acentos neón (magenta `#FF007F`, cian
  `#00E5FF`, lima `#B2FF05`, morado `#7B2CBF`) tal como en el mockup —
  defínelo como tokens de CSS/variables reutilizables, no repitas los hex
  sueltos en cada componente.
- Formateo de moneda: helper reutilizable para pesos colombianos (COP),
  ej. `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app y navega entre las rutas base (aunque las
      vistas estén vacías/placeholder todavía).
- [ ] Existe un helper de formateo de moneda en COP reutilizado por el resto
      de tareas (no cada pantalla reinventa el formato).
- [ ] Existe un cliente API tipado centralizado, no `fetch` sueltos repetidos
      por componente.
- [ ] Paleta de colores definida como variables/tokens, no hex hardcodeados
      dispersos.

## Notas de implementación

Proyecto creado en `frontend/` con `npm create vite@latest -- --template vue-ts`
(Vue 3.5, TypeScript ~6, Vite 8) + `vue-router@4`. No se agregaron otras
dependencias (nada de Pinia/axios/UI kit) para no introducir librerías no
pedidas por la tarea; el cliente HTTP usa `fetch` nativo y el estado de auth
es un composable con `ref` + `localStorage`, sin store global.

Estructura creada bajo `frontend/src/`:
- `api/client.ts`: wrapper tipado sobre `fetch` (`apiClient.get/post/put/patch/delete`),
  agrega `Authorization: Bearer <token>` automáticamente si hay sesión (`auth: false`
  para desactivarlo, ej. en el propio login), parsea JSON, lanza `ApiError` con
  `status`/`body`/mensaje (usa `detail` si el backend lo manda, como suele hacer
  FastAPI). Base URL viene de `import.meta.env.VITE_API_URL` (tipado en
  `vite-env.d.ts`), sin ningún `localhost` hardcodeado en el código — el valor vive
  en `.env` / `.env.example` (`VITE_API_URL=http://localhost:8000` como default de
  dev, gitignoreado salvo `.env.example`).
- `api/types.ts`: contrato `LoginRequest`/`LoginResponse` para `POST /auth/login`
  basado en `tasks/backend/BE-008-auth-login.md`. **Ambigüedad marcada explícitamente
  en el código**: BE-008 solo especifica que la respuesta trae un token JWT, no el
  shape exacto (¿`token_type`? ¿datos de usuario? ¿nombre del campo es `token` o
  `access_token`?). Tipé el mínimo común (`{ token: string }`) y dejé un comentario
  para ajustar cuando BE-008 esté implementado — FE-002 deberá confirmarlo contra el
  backend real.
- `composables/useAuth.ts`: `getToken/setToken/clearToken` + `useAuth()` con
  `isAuthenticated()`. Solo maneja el mecanismo de guardado del token
  (`localStorage`, key `bf_token`); la integración real de login (llamar al
  endpoint, manejar error 401, etc.) queda para FE-002 como indica el alcance.
- `router/index.ts`: rutas para `/login`, `/dashboard`, `/inventario`,
  `/productos`, `/mesas`, `/ventas`, `/contabilidad`, `/categorias` y catch-all
  404. Guard global `beforeEach`: si la ruta requiere auth (`meta.requiresAuth`)
  y no hay token, redirige a `/login` (con `redirect` en la query); si ya hay
  token y se intenta ir a `/login`, redirige a `/dashboard`.
- `layouts/DefaultLayout.vue` (sidebar + contenido) y `layouts/AuthLayout.vue`
  (pantalla completa centrada, sin sidebar) — el router monta cada grupo de rutas
  bajo el layout correspondiente.
- `components/layout/AppSidebar.vue`: nav lateral con el orden de items tal cual
  aparece en el mockup (`Dashboard, Inventario, Productos, Ventas, Contabilidad,
  Categorías`, confirmado con Grep acotado sobre
  `Brainfreezee Panel (offline).html`, línea única minificada). **El mockup no
  incluye una pantalla de "Mesas"** (no aparece en su navegación ni en su estado
  `screen`), pero la tarea la pide explícitamente en el Alcance y existe
  `FE-006-pantalla-mesas.md`, así que agregué el ítem `Mesas` entre `Productos` y
  `Ventas` siguiendo el mismo estilo visual — el planner puede ajustar la posición
  si tenía otra idea. El botón "Cerrar sesión" limpia el token y navega a `/login`.
- `components/common/ViewPlaceholder.vue`: placeholder genérico reutilizado por
  todas las vistas (`title` como prop) para no duplicar el mismo bloque de
  "pantalla pendiente" en cada archivo.
- `views/*.vue`: una vista placeholder por ruta (`DashboardView`,
  `InventarioView`, `ProductosView`, `MesasView`, `VentasView`,
  `ContabilidadView`, `CategoriasView`, `NotFoundView`) más `LoginView.vue` con
  una tarjeta centrada simple (el form real es FE-002).
- `utils/currency.ts`: `formatCOP(value: number)` con
  `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`
  — sin decimales de centavo, consistente con la nota de BE-001 sobre cómo maneja
  el negocio los montos en COP.
- `assets/styles/tokens.css`: variables CSS con la paleta neón del mockup
  (magenta `#FF007F`, cian `#00E5FF`, lima `#B2FF05`, morado `#7B2CBF`, más
  `purpleDeep #5E17EB` que también usa el mockup) y colores de fondo/superficie/texto
  extraídos del mockup (`#0B0410` fondo, `#0F0616` superficie, `#F2EAFB` texto),
  más tokens de radios y ancho de sidebar. `assets/styles/base.css` importa los
  tokens y aplica el reset/tema oscuro base (`body`, `#app`, tipografía `Inter`).
  El resto de componentes referencian estas variables (`var(--color-*)`) en vez
  de hex sueltos.
- `.env.example` y `.env` (gitignoreados salvo el example) con
  `VITE_API_URL=http://localhost:8000`; `vite-env.d.ts` tipa `ImportMetaEnv`.

Cómo probarlo:
1. `cd frontend && npm install` (ya instalado en este entorno).
2. `npm run dev` y abrir `http://localhost:5173` — redirige a `/login` (sin
   token en `localStorage`). Navegar manualmente a `/dashboard`,
   `/inventario`, `/productos`, `/mesas`, `/ventas`, `/contabilidad`,
   `/categorias` también redirige a `/login` mientras no haya token.
3. Para simular sesión y ver el layout con sidebar: en la consola del navegador
   ejecutar `localStorage.setItem('bf_token', 'demo')` y recargar — ya se puede
   navegar entre las rutas protegidas usando el sidebar, y `/login` redirige a
   `/dashboard`. "Cerrar sesión" limpia el token y vuelve a redirigir a login.
4. Verificación adicional ya corrida en este entorno: `npx vue-tsc -b` (sin
   errores) y `npm run build` (build exitoso, ver `frontend/dist/` tras
   correrlo).

Pendiente para tareas futuras (fuera de alcance de FE-001): FE-002 debe
confirmar el shape real de `LoginResponse` contra el backend cuando BE-008
esté implementado, y decidir si el guard debe además validar expiración/validez
del token contra el backend (aquí solo se valida presencia en localStorage).

## Revisión

**Veredicto: `done`**

Verificado en este entorno:
- `npx vue-tsc -b` corre sin errores. ✅
- Estructura, router, layouts, sidebar y vistas placeholder revisados en
  `frontend/src/` — cumplen los 4 criterios de aceptación:
  - `router/index.ts` define rutas para `/login`, `/dashboard`,
    `/inventario`, `/productos`, `/mesas`, `/ventas`, `/contabilidad`,
    `/categorias` + catch-all 404, con guard `beforeEach` que redirige a
    `/login` si no hay token y a `/dashboard` si ya hay sesión y se intenta
    ir a `/login`. ✅
  - `utils/currency.ts` (`formatCOP`) es el único punto de formateo COP,
    con `Intl.NumberFormat('es-CO', ...)` sin decimales, consistente con la
    decisión de BE-001 sobre montos en COP. ✅
  - `api/client.ts` es un cliente HTTP centralizado y tipado (`apiClient.get
    /post/put/patch/delete`) sobre `fetch`, con manejo de `Authorization`,
    parseo de errores (`ApiError` con `status`/`body`), y base URL leída de
    `import.meta.env.VITE_API_URL` sin ningún `localhost` hardcodeado en el
    código fuente (`.env`/`.env.example` correctamente gitignoreados salvo
    el example). ✅
  - `assets/styles/tokens.css` define la paleta neón completa como
    variables CSS (`--color-magenta`, `--color-cyan`, `--color-lime`,
    `--color-purple`, más `--color-purple-deep`), y los componentes
    (`AppSidebar.vue`, `LoginView.vue`, etc.) las consumen vía `var(--color-*)`
    sin hex sueltos dispersos. ✅
- Confirmé contra `Brainfreezee Panel (offline).html` (grep acotado) que el
  orden real del mockup es Dashboard, Inventario, Productos, Ventas,
  Contabilidad, Categorías, sin "Mesas" — tal como documentan las notas. La
  decisión de insertar "Mesas" entre Productos y Ventas es razonable (la
  tarea la pide explícitamente en el Alcance) y quedó bien señalizada para
  que el planner la ajuste si tenía otra posición en mente; no es un
  hallazgo bloqueante.
- El tipado mínimo de `LoginResponse` (`{ token: string }`) en `api/types.ts`
  está correctamente justificado y comentado in-line dado que BE-008 aún no
  define el shape completo; queda trazado para que FE-002 lo confirme contra
  el backend real. Tampoco es bloqueante para esta tarea.
- No se encontró `any` injustificado, `v-html`/`innerHTML` con datos no
  confiables, ni lógica de fetch repetida fuera de `api/client.ts`. Sin
  scope creep: no se agregaron librerías no pedidas (Pinia/axios/UI kit),
  tal como aclaran las notas.

Sin hallazgos bloqueantes. Aprobada.
