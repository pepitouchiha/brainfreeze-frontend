---
id: FE-002
title: Pantalla de Login
area: frontend
status: done
priority: medium
depends_on: [FE-001, BE-008]
created_by: planner
---

## Objetivo

Pantalla de login replicando el diseño del mockup (fondo con gradientes
radiales magenta/cian sobre negro, card centrado con email/password).

## Alcance

- Lee la tarea BE-008 (`tasks/backend/BE-008-auth-login.md`) para el contrato
  exacto de `POST /auth/login` (payload y respuesta) antes de implementar,
  aunque el endpoint todavía no esté implementado.
- Formulario email/password con validación básica de campos requeridos.
- Al autenticar correctamente, guarda el token (ej. `localStorage`) y navega
  al Dashboard.
- Mensaje de error visible si las credenciales son incorrectas (401).
- El cliente API centralizado (de FE-001) debe adjuntar el token guardado en
  las siguientes llamadas automáticamente.

## Criterios de aceptación

- [ ] Con credenciales correctas, redirige al Dashboard y persiste la sesión
      (recargar la página no vuelve a pedir login mientras el token sea
      válido).
- [ ] Con credenciales incorrectas, muestra un mensaje de error sin romper la
      pantalla.
- [ ] Cerrar sesión (logout) limpia el token y redirige a login.
- [ ] Rutas protegidas redirigen a login si no hay token.

## Notas de implementación

### Archivos creados/tocados

- `frontend/src/api/types.ts`: se ajustó `LoginResponse` de `{ token: string }`
  (tipado provisional de FE-001) al shape real confirmado contra
  `backend/app/schemas/auth.py` (`TokenResponse`): `{ access_token: string,
  token_type: string }`. Verificado en vivo contra el backend real
  (`POST /auth/login` devuelve exactamente `{"access_token":"...",
  "token_type":"bearer"}`).
- `frontend/src/api/auth.ts` (nuevo): `login(payload: LoginRequest):
  Promise<LoginResponse>`, llama `apiClient.post('/auth/login', payload,
  { auth: false })` — `auth: false` porque login no debe mandar un
  `Authorization` (no hay token todavía, y aunque lo hubiera de una sesión
  vieja no aplica a este endpoint).
- `frontend/src/views/LoginView.vue`: reemplaza el placeholder por el
  formulario real (email/password), replicando el diseño del mockup
  (`Brainfreezee Panel (offline).html`, confirmado con Grep acotado sobre el
  bloque `showLogin`): card con gradiente de marca "BRAINFREEZEE", subtítulo,
  inputs con foco cian, botón con gradiente morado. Usa tokens de
  `assets/styles/tokens.css` en vez de los hex del mockup directamente.
  - Validación básica: email/password requeridos antes de llamar a la API.
  - Al autenticar OK: `setToken(response.access_token)` (composable de
    FE-001) y `router.push(redirect)` — respeta `route.query.redirect` si el
    guard de rutas empujó al usuario a login desde una ruta protegida
    (mecanismo ya definido en FE-001), o `/dashboard` por defecto.
  - Error 401 (`ApiError` de `api/client.ts`) muestra "Correo o contraseña
    incorrectos."; cualquier otro error (red caída, 500, etc.) muestra un
    mensaje genérico — en ningún caso se deja `errorMessage` con el `detail`
    crudo del backend para no filtrar información innecesaria en un login.
  - Estado `isSubmitting` deshabilita el formulario mientras la petición está
    en vuelo (evita doble submit) y cambia el texto del botón.

No se tocó `composables/useAuth.ts` ni `router/index.ts`: el mecanismo de
guardado de token y el guard de rutas ya estaban completos desde FE-001 y
cumplen los criterios de "persistir sesión" y "rutas protegidas redirigen a
login sin token" sin cambios. Tampoco se tocó `components/layout/AppSidebar.vue`:
el botón "Cerrar sesión" ya limpiaba el token y navegaba a `/login` desde
FE-001; se verificó que sigue funcionando igual.

### Decisiones tomadas

- Se resolvió la ambigüedad marcada explícitamente por FE-001 sobre el shape
  de `LoginResponse` confirmando contra el backend real (BE-008 ya está
  `done`): es `access_token`/`token_type`, no `token`.
- No se agregó lógica de "recordarme" ni de refresco de token — no lo pide
  la tarea; la sesión dura lo que dure el JWT (`JWT_EXPIRE_MINUTES=480` en
  el backend), y si expira, la siguiente llamada protegida devolverá 401 (el
  cliente API no intercepta 401 globalmente para forzar logout automático —
  fuera de alcance de esta tarea, los criterios solo piden que rutas sin
  token redirijan, no que un token expirado se detecte proactivamente).

### Cómo probarlo

1. Backend: `cd backend && .\.venv\Scripts\python -m uvicorn app.main:app --port 8000`
   (crear usuario de prueba primero si no existe:
   `.\.venv\Scripts\python -m app.scripts.crear_usuario admin@brainfreeze.com "MiPasswordSegura123"`).
2. Frontend: `cd frontend && npm run dev`, abrir `http://localhost:5173`
   (redirige a `/login`).
3. Probar con credenciales incorrectas → mensaje "Correo o contraseña
   incorrectos.", el formulario sigue usable.
4. Probar con las credenciales del usuario creado → redirige a
   `/dashboard`, `localStorage` tiene `bf_token`. Recargar la página
   permanece en `/dashboard` (no vuelve a pedir login).
5. Navegar directo a una ruta protegida sin sesión (o en incógnito) →
   redirige a `/login` con `?redirect=/esa-ruta`; tras login exitoso navega
   a esa ruta original.
6. "Cerrar sesión" en el sidebar limpia `bf_token` de `localStorage` y
   redirige a `/login`.

Verificado en este entorno: `npx vue-tsc -b` sin errores. Backend real
levantado (`uvicorn` en `127.0.0.1:8000`) y `POST /auth/login` probado
directamente con `curl` confirmando el shape exacto de la respuesta que
consume `api/auth.ts`. Frontend real levantado (`npm run dev` en
`localhost:5173`) sirviendo la SPA correctamente (200 OK); no se tomó
captura del navegador en este entorno (sin herramienta de automatización de
navegador disponible), pero la lógica del componente y el contrato de API
fueron verificados end-to-end por separado (curl al backend + revisión del
código del componente).

## Revisión

**Veredicto: `done`**

Verificado end-to-end contra un backend real (no solo lectura de código):

- `npx vue-tsc -b` y `npx vite build` pasan sin errores.
- Levanté `uvicorn` real en `127.0.0.1:8000` (mismo puerto que
  `frontend/.env` → `VITE_API_URL`), creé un usuario de prueba, y probé
  `POST /auth/login` con `Origin: http://localhost:5173` (simulando el
  origen real del dev server de Vite) para validar CORS y el shape exacto de
  la respuesta que consume `api/auth.ts`: preflight `OPTIONS` → 200,
  `POST` con credenciales correctas → 200 `{"access_token":"...",
  "token_type":"bearer"}` (coincide exactamente con `LoginResponse` en
  `api/types.ts`), credenciales incorrectas → 401
  `{"detail":"Credenciales inválidas"}`.
- Revisé `LoginView.vue`: mapea 401 a "Correo o contraseña incorrectos.",
  cualquier otro error a un mensaje genérico (no filtra el `detail` crudo del
  backend), `isSubmitting` bloquea doble submit, respeta `route.query.redirect`.
- `composables/useAuth.ts` (no tocado, correcto no tocarlo): `setToken`
  persiste en `localStorage` bajo `bf_token`; `router/index.ts` (`beforeEach`)
  redirige a `/login?redirect=...` si `requiresAuth` y no hay token, y de
  `/login` a `/dashboard` si ya hay sesión — cumple los 4 criterios de
  aceptación de la tarea de forma verificable en el código existente.
- `AppSidebar.vue`: "Cerrar sesión" llama `clearToken()` y navega a
  `/login` vía `RouterLink` — correcto.

La corrección del shape de `LoginResponse` (de `{token}` a
`{access_token, token_type}`) está bien fundamentada y confirmada aquí de
nuevo independientemente contra el backend real: es el contrato correcto.

No se encontró `any` injustificado, ni `v-html`/`innerHTML` con datos no
confiables. El manejo de estados de carga/error es explícito y correcto.

Todos los criterios de aceptación se cumplen. Se limpiaron procesos y DB de
prueba generados durante esta revisión.
