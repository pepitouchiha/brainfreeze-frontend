---
id: FE-006
title: Pantalla de Mesas (lista con estado)
area: frontend
status: done
priority: high
depends_on: [FE-001, BE-005]
created_by: planner
---

## Objetivo

Pantalla nueva (no existe en el mockup): lista simple de mesas con su estado
(libre / ocupada). Sin mapa/plano visual — confirmado con el dueño del
negocio.

## Alcance

- Lee el contrato de `GET/POST /mesas` y `POST /mesas/{id}/liberar` en
  `tasks/backend/BE-005-modelo-mesas.md`, incluyendo la regla documentada ahí
  sobre cuándo pasa a "ocupada".
- Lista/tarjetas de mesas mostrando nombre/número y estado con un color claro
  (ej. verde/lima = libre, magenta/rojo = ocupada, reutilizando tokens de
  FE-001).
- Acción para crear una mesa nueva (nombre o número).
- Acción explícita para marcar una mesa como libre manualmente.
- Desde esta pantalla debe poder iniciarse una venta para esa mesa (enlace o
  botón que lleve a la pantalla de Ventas de FE-007 con la mesa
  preseleccionada) — pero la lógica de la venta en sí vive en FE-007, aquí
  solo el punto de entrada.

## Criterios de aceptación

- [ ] La lista de mesas refleja el estado real que devuelve el backend.
- [ ] Marcar una mesa como libre manualmente funciona y actualiza la UI sin
      recargar toda la página.
- [ ] Crear una mesa nueva la agrega a la lista en estado libre.
- [ ] Iniciar una venta desde una mesa lleva a la pantalla de Ventas con esa
      mesa ya seleccionada.

## Notas de implementación

### Archivos creados/tocados

- `frontend/src/api/types.ts`: se agregaron `EstadoMesa` (`'libre' |
  'ocupada'`), `Mesa`, `MesaCreate`, confirmados contra
  `backend/app/schemas/mesa.py` (`EstadoMesa`, `MesaOut`, `MesaCreate`).
- `frontend/src/api/mesas.ts` (nuevo): `listMesas`, `createMesa`,
  `liberarMesa` (`POST /mesas/{id}/liberar`). No se agregaron `updateMesa`
  ni `deleteMesa` — el Alcance de esta tarea (FE-006) solo pide listar,
  crear, liberar manualmente e iniciar venta desde una mesa; editar
  nombre/eliminar mesa no están en el Alcance ni en los Criterios de
  aceptación aunque el backend (BE-005) sí los expone (`PUT/PATCH` y
  `DELETE /mesas/{id}`). Lo dejo anotado explícitamente por si el planner
  quiere agregarlos en una tarea futura — no los incluí para no exceder el
  alcance pedido.
- `frontend/src/composables/useMesas.ts` (nuevo): mismo patrón que
  `useCategorias.ts` (estado + CRUD parcial + `messageFor` para errores
  legibles). `liberar(id)` actualiza solo la mesa afectada en el array local
  con la respuesta real del backend (sin recargar todo el listado).
- `frontend/src/views/MesasView.vue`: reemplaza el placeholder. Grid de
  tarjetas por mesa con nombre y badge de estado (verde/lima `--color-lime`
  para libre, magenta `--color-magenta` para ocupada, tal como pide el
  Alcance reutilizando tokens de FE-001). Formulario inline de alta (mismo
  patrón que `CategoriasView.vue`: nombre/número). Cada tarjeta tiene dos
  acciones:
  - "Iniciar venta": `router.push({ name: 'ventas', query: { mesaId:
    String(mesa.id) } })` — el punto de entrada pedido por el Alcance
    ("enlace o botón que lleve a la pantalla de Ventas con la mesa
    preseleccionada"). **Contrato dejado para FE-007**: la vista de Ventas
    debe leer `route.query.mesaId` para preseleccionar la mesa; hoy
    `VentasView.vue` sigue siendo el placeholder de FE-001 (implementarla es
    responsabilidad de FE-007, fuera de mi alcance), así que navegar no
    muestra nada especial todavía, solo demuestra que el enlace/query param
    llega correctamente.
  - "Marcar libre": llama `POST /mesas/{id}/liberar`; deshabilitado si la
    mesa ya está `libre` (evita una llamada de red no-op innecesaria, aunque
    el backend la tolera sin error) y muestra "Liberando…" mientras está en
    vuelo. Si falla, el mensaje de error se muestra inline en esa tarjeta.

### Decisiones tomadas

- **Sin acción para "ocupar" manualmente una mesa**: BE-005 documenta
  explícitamente que no expone ese endpoint (la mesa pasa a `ocupada` como
  efecto colateral de crear una venta, responsabilidad de BE-006/FE-007) —
  consistente con no inventar un endpoint/acción que no existe en el
  backend.
- **Botón "Marcar libre" deshabilitado (no oculto) cuando la mesa ya está
  libre**: se prefirió deshabilitar en vez de ocultar para que el layout de
  la tarjeta no salte/cambie de tamaño entre estados.
- **Colores de estado**: `libre` → `var(--color-lime)`, `ocupada` →
  `var(--color-magenta)`, tal como sugiere el Alcance ("verde/lima = libre,
  magenta/rojo = ocupada").

### Cómo probarlo

1. Backend: `cd backend && .\.venv\Scripts\python -m uvicorn app.main:app --port 8000`
   (con usuario creado, ver FE-002) y sesión iniciada en el frontend.
2. Ir a `/mesas`: lista vacía inicialmente ("Todavía no hay mesas
   creadas.").
3. "+ Nueva mesa" → "Mesa 1" → Crear: aparece la tarjeta en estado "Libre"
   (badge lima) sin recargar la página.
4. Para ver el estado "Ocupada" en la UI (no hay todavía forma de ocuparla
   desde el frontend, ya que eso depende de BE-006/FE-007 Ventas, no
   implementado): actualizar manualmente en SQLite
   `UPDATE mesas SET estado='ocupada' WHERE id=1;` y recargar `/mesas` — la
   tarjeta muestra el badge magenta "Ocupada" y el botón "Marcar libre" se
   habilita.
5. "Marcar libre" sobre esa mesa: vuelve a "Libre" sin recargar la página
   (confirmado contra el endpoint real).
6. "Iniciar venta" en cualquier mesa: navega a `/ventas?mesaId=<id>` (visible
   en la URL del navegador); la vista de Ventas en sí es un placeholder
   hasta FE-007.

Verificado en este entorno: `npx vue-tsc -b` sin errores. Backend real
levantado y probado con `curl` de punta a punta con el token real de
`POST /auth/login`: crear mesa (201, estado inicial `libre`), listar (200),
liberar (200, `estado` se mantiene/fuerza a `libre`) — mismo shape que
consume `api/mesas.ts`/`useMesas.ts`.

## Revisión

**Veredicto: `done`**

Verificado con `npx vue-tsc -b` y `npx vite build` sin errores.

Revisión de código:

- `api/types.ts`: `Mesa`/`MesaCreate`/`EstadoMesa` coinciden con
  `backend/app/schemas/mesa.py` (confirmado también en la revisión de
  BE-003/BE-004, donde probé `mesas.py` en vivo tras la migración de
  `categorias.py`: `GET /mesas`, `POST /mesas` devuelven exactamente el
  shape `{id, nombre_o_numero, estado}` que consume este código).
- `useMesas.ts`: mismo patrón sólido que `useCategorias.ts` (actualización
  local optimista, `messageFor` para errores legibles, estados
  `isLoading`/`loadError` explícitos).
- `MesasView.vue`: badge de estado con colores correctos según lo pedido
  (`--color-lime` para libre, `--color-magenta` para ocupada). "Marcar
  libre" deshabilitado (no oculto) cuando ya está libre — decisión
  razonable, documentada, evita layout shift. "Iniciar venta" navega a
  `{ name: 'ventas', query: { mesaId: String(mesa.id) } }` — cumple el
  criterio de dejar el punto de entrada para FE-007.

**Sobre la decisión de no incluir editar/eliminar mesa desde la UI**: se
revisó el Alcance y los Criterios de aceptación de esta tarea (arriba) y
efectivamente ninguno menciona editar nombre ni eliminar mesa — solo
"crear", "marcar como libre manualmente" e "iniciar venta". La
interpretación del implementador es correcta: agregar esas acciones hubiera
sido scope creep no pedido. Dejarlo anotado explícitamente en las notas de
implementación (para que el planner decida si amerita una tarea futura) es
el manejo correcto de esta ambigüedad, en vez de asumir silenciosamente o
implementarlo sin que se pidiera.

No se encontró `any` injustificado ni `v-html`/`innerHTML` inseguro.
Consistente con la estructura ya usada en `CategoriasView.vue`.

Todos los criterios de aceptación se cumplen.
