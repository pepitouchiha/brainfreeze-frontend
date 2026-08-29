---
id: FE-010
title: Sidebar — iconos de navegación, resaltado activo por sección y pie de usuario
area: frontend
status: done
priority: medium
depends_on: [FE-009]
created_by: planner
---

## Objetivo

Acercar `AppSidebar.vue` al mockup de referencia inspeccionado por el
planner: cada item de navegación con un ícono, el item activo resaltado con
un color de acento que varía según la sección (hoy todos se resaltan igual,
en lima), y un pie de sidebar con avatar de usuario en vez del enlace de
texto suelto "Cerrar sesión" que hay actualmente.

## Alcance

- Agregar un ícono SVG inline pequeño (outline, ~20x20) a cada uno de los 7
  nav items (`dashboard, inventario, productos, mesas, ventas, contabilidad,
  categorias`) definidos en `AppSidebar.vue`. No agregar ninguna librería de
  iconos nueva a `package.json` (el proyecto no tiene ninguna hoy). El sprite
  `frontend/public/icons.svg` existente no sirve para esto: son iconos
  sociales (bluesky, discord, github, x) de una plantilla, sin relación con
  la navegación de la app — no reutilizarlo, diseñar SVGs propios simples.
- Asignar un color de acento distinto por sección para el estado activo,
  usando únicamente los colores ya definidos en `tokens.css`
  (`--color-cyan`, `--color-lime`, `--color-magenta`, `--color-purple`) — no
  inventar colores nuevos. Hoy el estado activo (`.nav-item--active`) es
  siempre `--color-lime` para cualquier sección; debe variar.
- Reemplazar el `<RouterLink to="/login" class="logout">Cerrar sesión</RouterLink>`
  actual (al fondo del sidebar, con `margin-top: auto`) por un pie de sidebar
  con: un avatar circular con la inicial (mayúscula) del usuario autenticado,
  con fondo usando el degradado de marca de FE-009; una etiqueta de
  texto debajo o al lado con el identificador del usuario; y un botón/enlace
  "Cerrar sesión" separado visualmente del avatar (no fusionado en el mismo
  elemento clicable).
- Sobre el identificador de usuario: el backend no guarda ni devuelve un
  "nombre" de usuario — `backend/app/models/usuario.py` solo tiene `email`, y
  `POST /auth/login` (`backend/app/schemas/auth.py`, `TokenResponse`) solo
  devuelve `access_token`/`token_type`, no el email. Esta tarea NO debe tocar
  el backend. Alternativa puramente frontend: en `LoginView.vue`, al hacer
  login exitoso, guardar el email ingresado (ya está en el formulario) junto
  al token (ej. en `useAuth.ts`, una clave nueva en `localStorage` como
  `bf_user_email`); el sidebar lee ese valor para la inicial del avatar y la
  etiqueta. Si no hay ningún email guardado (p. ej. una sesión iniciada antes
  de este cambio, con token pero sin el nuevo campo), usar "Administrador"
  como texto de respaldo y "A" como inicial del avatar.
- No incluye: cambios de backend, ni un endpoint de perfil de usuario.

## Criterios de aceptación

- [ ] Cada item de navegación del sidebar muestra un ícono junto a su
      etiqueta de texto.
- [ ] El item de navegación activo se resalta con un color de acento que
      varía según la sección (verificable navegando entre al menos 2
      secciones y comprobando que el color de resaltado difiere entre
      ellas).
- [ ] El pie del sidebar muestra un avatar circular con una inicial en
      mayúscula y una etiqueta de usuario (el email guardado al iniciar
      sesión, o "Administrador" si no hay ninguno guardado), más un botón o
      enlace "Cerrar sesión" identificable por separado.
- [ ] Cerrar sesión sigue limpiando el token (`clearToken`) y redirigiendo a
      `/login`, igual que hoy.
- [ ] `npx vue-tsc -b` corre sin errores.

## Notas de implementación

- `AppSidebar.vue` se reescribió por completo:
  - Cada `NavItem` ahora tiene `accent: 'cyan' | 'lime' | 'magenta' | 'purple'`
    y `icon` (markup SVG inline como string, sin librería nueva — 7 iconos
    outline propios de 24x24 renderizados a 20x20, aplicados vía `v-html`
    dentro de un `<svg>` con `stroke="currentColor"`, ya que son estáticos y
    no dependen de input de usuario). Asignación de acentos cíclica sobre los
    4 colores de `tokens.css` (cyan/lime/magenta/purple, sin inventar
    ninguno): dashboard=cyan, inventario=lime, productos=magenta,
    mesas=purple, ventas=cyan, contabilidad=lime, categorías=magenta — nunca
    se repite el acento entre dos secciones consecutivas, y se confirmó
    visualmente que Dashboard (cyan) e Inventario (lime) difieren.
  - El color de acento activo ya no está fijo en CSS (`--color-lime` para
    todos): cada `RouterLink` recibe vía `:style` dos custom properties
    (`--nav-accent-text`, `--nav-accent-bg`) calculadas a partir de
    `item.accent`; la regla `.nav-item--active` las consume con `var(...)`.
    `accentBg` usa los mismos valores rgba de opacidad ya usados en el resto
    de la app para tags (`0.14`, y `0.22` para purple por ser más oscuro y
    necesitar más opacidad para notarse).
  - El pie del sidebar (antes `<RouterLink class="logout">Cerrar sesión</RouterLink>`
    suelto) se reemplazó por `.sidebar-footer`: un `.user-block` con un
    avatar circular (`.avatar.brand-gradient-bg`, nueva clase utilitaria en
    `tokens.css` que reutiliza el mismo degradado magenta→púrpura→cian de
    FE-009 pero como `background` en vez de `background-clip: text`) con la
    inicial en mayúscula, más una etiqueta de texto con el email; y, por
    separado (no fusionado), un botón/enlace "Cerrar sesión" con su propio
    borde.
  - El identificador de usuario sale de `getUserEmail()` (`useAuth.ts`,
    guardado en `LoginView.vue` durante FE-009); si no hay ninguno guardado
    (sesión vieja con token pero sin email), se usa "Administrador" como
    etiqueta y "A" como inicial, tal como pide el criterio de aceptación.
  - `onLogout` ahora llama tanto a `clearToken()` (comportamiento previo,
    sigue redirigiendo a `/login` vía el mismo patrón de `RouterLink
    to="/login" @click="onLogout"`) como a `clearUserEmail()` (nuevo, para
    que el próximo usuario que inicie sesión en el mismo navegador no herede
    el avatar/email de la sesión anterior).
- No se reutilizó `frontend/public/icons.svg` (iconos sociales de plantilla,
  sin relación con la navegación) ni se agregó ninguna librería de iconos.
- Archivos tocados: `frontend/src/components/layout/AppSidebar.vue`,
  `frontend/src/assets/styles/tokens.css` (nueva `.brand-gradient-bg`).
- Cómo probarlo: `npm run dev`, iniciar sesión con
  `admin@brainfreeze.com` / `Admin1234`, y navegar entre Dashboard (acento
  cyan) e Inventario (acento lima) para confirmar visualmente el cambio de
  color; verificar el pie del sidebar con avatar "A" + email + botón
  "Cerrar sesión" separado, y confirmar que cerrar sesión redirige a
  `/login` y limpia el token.
- `npx vue-tsc -b` corre sin errores. Verificado visualmente con capturas
  (login, dashboard con sidebar completo, inventario) vía Puppeteer/Edge
  headless.

## Revisión

**Veredicto: done**

Verificado en `frontend/src/components/layout/AppSidebar.vue`:

- Los 7 `navItems` tienen `icon` (SVG outline propio, 24x24 escalado a 20x20
  vía `.nav-icon`) y `accent`. Los acentos no se repiten entre secciones
  consecutivas (cyan, lime, magenta, purple, cyan, lime, magenta) y usan
  únicamente `--color-cyan/lime/magenta/purple` de `tokens.css` — ningún
  color inventado. `.nav-item--active` consume `--nav-accent-text`/
  `--nav-accent-bg` calculadas por item vía `:style`, reemplazando el lima
  fijo anterior.
- El pie del sidebar (`.sidebar-footer`) tiene `.user-block` con avatar
  circular (`brand-gradient-bg`, reutiliza el degradado de FE-009 como
  `background` en vez de `background-clip: text`) con la inicial en
  mayúscula, etiqueta con el email (`getUserEmail() ?? 'Administrador'`,
  inicial `'A'` de respaldo), y el botón "Cerrar sesión" como elemento
  separado con su propio borde — no fusionado con el avatar.
- `onLogout` llama `clearToken()` y `clearUserEmail()`; el `RouterLink
  to="/login"` sigue redirigiendo igual que antes.
- No se reutilizó `public/icons.svg` (iconos sociales de plantilla) ni se
  agregó ninguna librería de iconos a `package.json` — confirmado, solo
  `vue`/`vue-router` como dependencias.
- `npx vue-tsc -b` corre sin errores (verificado en este entorno).

Sobre el uso de `v-html` para renderizar `item.icon` dentro del `<svg>`: no
representa riesgo XSS porque el contenido es un array de strings estáticos
definidos en el propio componente, no datos de usuario ni de API — uso
justificado y correctamente acotado.

Todos los criterios de aceptación se cumplen.
