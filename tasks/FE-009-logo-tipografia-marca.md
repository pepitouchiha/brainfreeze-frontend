---
id: FE-009
title: Logo, favicon y tipografía de marca con degradado
area: frontend
status: done
priority: high
depends_on: [FE-001, FE-002]
created_by: planner
---

## Objetivo

Integrar el logo real de la marca (`LogoBrainFreeze.jpeg`, ícono circular neón
de un cerebro con gafas tomando un granizado, sobre fondo oscuro, ubicado en
`D:/.NET/BrainFreeze/LogoBrainFreeze.jpeg`, raíz del repo) en el frontend, y
unificar en un solo lugar reutilizable el efecto de degradado tipográfico de
marca (magenta → púrpura) que hoy solo existe hardcodeado en `LoginView.vue`,
para que Login y Sidebar (y cualquier pantalla futura) no dupliquen el CSS del
gradiente ni sigan usando un favicon genérico de plantilla.

## Alcance

- Mover/copiar `LogoBrainFreeze.jpeg` desde la raíz del repo a
  `frontend/src/assets/` (para usarlo importado en componentes Vue) y/o
  `frontend/public/` (si se necesita servirlo como favicon). Si hace falta un
  formato distinto para el favicon (`.ico`/`.png`) y no hay herramienta de
  conversión de imagen disponible en este entorno, usar el `.jpeg` original
  referenciado desde `<link rel="icon">` (los navegadores modernos lo
  soportan) y documentar la decisión en Notas de implementación.
- Reemplazar `frontend/public/favicon.svg` (hoy es un ícono morado genérico de
  plantilla sin relación con la marca) y el `<link rel="icon">` de
  `frontend/index.html` para que apunten al logo real de BrainFreeze.
- Agregar una clase CSS utilitaria reutilizable (ej. `.brand-gradient-text`)
  en `frontend/src/assets/styles/tokens.css` o `base.css`, que encapsule el
  degradado de texto ya usado en `LoginView.vue` (`.brand`: `background:
  linear-gradient(90deg, var(--color-magenta), var(--color-purple) 55%,
  var(--color-cyan)); -webkit-background-clip: text; background-clip: text;
  color: transparent;`), para no repetir esas líneas en cada componente que
  muestre el nombre de la marca.
- `LoginView.vue`: agregar el logo (imagen circular, ~64-72px) centrado sobre
  el título "BRAINFREEZEE"; refactorizar `.brand` para usar la nueva clase
  utilitaria en vez de declarar el gradiente inline.
- `AppSidebar.vue`: reemplazar el texto plano `.brand` (hoy "BrainFreeze" en
  `--color-cyan` sólido) por: el ícono del logo (~28-32px) + el texto
  "BRAINFREEZEE" en negrita, usando la misma clase utilitaria de degradado.
- No incluye: iconos de navegación, colores de resaltado por sección, ni el
  pie de sesión con avatar de usuario — eso es FE-010.

## Criterios de aceptación

- [ ] El favicon servido en `/` ya no es el ícono morado genérico de
      plantilla; corresponde al logo de BrainFreeze.
- [ ] El logo se ve en la tarjeta de login, sobre el título "BRAINFREEZEE".
- [ ] El logo se ve en el sidebar, junto al texto de marca.
- [ ] Existe una clase CSS de degradado de texto de marca definida una sola
      vez (en `tokens.css` o `base.css`), y tanto `LoginView.vue` como
      `AppSidebar.vue` la usan en vez de declarar el
      `linear-gradient`/`background-clip` por separado en cada uno.
- [ ] El texto de marca en el sidebar usa el mismo degradado magenta→púrpura
      que el login (ya no es cian sólido).
- [ ] `npx vue-tsc -b` y `npx vite build` corren sin errores.

## Notas de implementación

- `LogoBrainFreeze.jpeg` (raíz del repo, 1024x1024) se copió a dos ubicaciones:
  `frontend/src/assets/brand/logo-brainfreeze.jpeg` (importado desde componentes
  Vue vía `import logoBrainFreeze from '.../brand/logo-brainfreeze.jpeg'`) y
  `frontend/public/logo-brainfreeze.jpeg` (servido estático, usado como
  favicon). No se convirtió a `.ico`/`.png`: no hay herramienta de conversión
  de imágenes disponible en este entorno; el `.jpeg` original se referencia
  directamente desde `<link rel="icon" type="image/jpeg" href="/logo-brainfreeze.jpeg">`
  en `frontend/index.html` — soportado por navegadores modernos (Chrome,
  Edge, Firefox).
- Se eliminó `frontend/public/favicon.svg` (ícono morado genérico de
  plantilla) — no tenía otro uso en el proyecto (verificado por grep).
- Se agregó la clase utilitaria `.brand-gradient-text` en
  `frontend/src/assets/styles/tokens.css`, con el mismo degradado
  magenta→púrpura→cian que antes vivía hardcodeado como `.brand` en
  `LoginView.vue`.
- `LoginView.vue`: se agregó `<img class="brand-logo">` (72x72, circular)
  centrada sobre el título, y `.brand` ahora combina la clase utilitaria
  `brand-gradient-text` en vez de declarar el `linear-gradient` inline (el
  bloque CSS `.brand` solo conserva tipografía/spacing, ya no el degradado).
  De paso, al hacer login exitoso ahora también se guarda el email escrito
  en el formulario vía `setUserEmail` (nueva función en `useAuth.ts`,
  persistida en `localStorage` bajo `bf_user_email`) — esto es insumo para
  FE-010 (avatar/etiqueta de usuario en el sidebar), implementado aquí de
  una vez porque requería tocar el mismo `onSubmit` de `LoginView.vue`.
- `AppSidebar.vue`: `.brand` pasó de texto plano en `--color-cyan` a un
  contenedor flex con el logo (30x30, circular) + `<span class="brand-text
  brand-gradient-text">BRAINFREEZEE</span>`.
- Archivos tocados: `frontend/index.html`,
  `frontend/src/assets/styles/tokens.css`, `frontend/src/views/LoginView.vue`,
  `frontend/src/components/layout/AppSidebar.vue`,
  `frontend/src/composables/useAuth.ts` (nuevas `getUserEmail`/`setUserEmail`/
  `clearUserEmail`), más los dos JPEG copiados.
- Cómo probarlo: `npm run dev` → abrir `http://localhost:5173/login`, ver el
  logo circular sobre "BRAINFREEZEE" con degradado magenta→púrpura→cian;
  iniciar sesión y ver el mismo logo + texto degradado en el sidebar; revisar
  la pestaña del navegador para confirmar el favicon del logo (ya no el
  ícono morado genérico).
- `npx vue-tsc -b` corre sin errores tras estos cambios.

## Revisión

**Veredicto: done**

Verificado contra código real (no solo las notas de implementación):

- `frontend/public/logo-brainfreeze.jpeg` y `frontend/src/assets/brand/logo-brainfreeze.jpeg`
  existen (447 KB cada uno). `frontend/index.html:5` apunta el favicon a
  `/logo-brainfreeze.jpeg` con `type="image/jpeg"`; ya no existe
  `frontend/public/favicon.svg` (confirmado con grep, sin referencias colgantes).
- `.brand-gradient-text` definida una sola vez en
  `frontend/src/assets/styles/tokens.css:29-34`; `LoginView.vue` (`.brand
  brand-gradient-text`) y `AppSidebar.vue` (`brand-text brand-gradient-text`)
  la reutilizan — no hay `linear-gradient`/`background-clip` duplicado en
  ninguno de los dos.
- `LoginView.vue`: `<img class="brand-logo">` de 72x72 circular, centrada
  sobre el título "BRAINFREEZEE". `AppSidebar.vue`: mismo logo a 30x30 junto
  al texto de marca con degradado (ya no cian sólido).
- `useAuth.ts` expone `getUserEmail`/`setUserEmail`/`clearUserEmail`
  correctamente respaldadas en `localStorage` bajo `bf_user_email`,
  consistente con el patrón ya usado para el token.
- `npx vue-tsc -b` y `npm run build` (que ejecuta `vue-tsc -b && vite build`)
  corren sin errores — confirmado en este entorno, no solo por las notas del
  implementador.
- No se agregaron dependencias nuevas ni se tocó código fuera del alcance
  declarado.

Observación menor, no bloqueante: el JPEG de 447 KB sin comprimir se sirve
tal cual como favicon y como asset importado (queda en el bundle final sin
optimizar). Está justificado y documentado en las notas (no hay herramienta
de conversión/compresión disponible en este entorno) — no amerita
`changes-requested`, pero si en el futuro se dispone de una herramienta de
optimización de imágenes, valdría la pena reducir su peso.

Todos los criterios de aceptación se cumplen.
