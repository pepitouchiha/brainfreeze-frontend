---
id: FE-039
title: Repensar la pantalla de Inventario
area: frontend
status: backlog
priority: low
depends_on: [FE-005]
created_by: user
---

## Objetivo

La pantalla de Inventario (FE-005) quedó deshabilitada temporalmente (no
aparece en el sidebar, la ruta `/inventario` redirige a `/dashboard`; la vista
y su código siguen en el repo). Según el dueño del negocio, el flujo actual no
está bien resuelto: implica demasiado trabajo manual para mantener el stock al
día y no refleja bien el uso real del negocio.

Antes de reactivarla hay que revisar de nuevo el enfoque con el planner: qué
datos de inventario son realmente accionables para una heladería/granizadería,
y cómo reducir la carga manual (¿ajustes automáticos al vender?, ¿umbrales más
simples?, ¿integrarlo distinto dentro de Productos?).

## Alcance

- Repensar el modelo de interacción de Inventario, no solo el estilo visual.
- Evaluar si el ajuste de stock debería derivarse automáticamente de las
  ventas en vez de requerir entrada manual constante.
- Definir de nuevo criterios de aceptación una vez decidido el enfoque.

## Estado actual

- Vista: `src/views/InventarioView.vue` (código intacto, no se tocó).
- Ruta deshabilitada en `src/router/index.ts` (`inventario` redirige a
  `/dashboard`).
- Link removido de `src/components/layout/AppSidebar.vue`.
- `src/views/DashboardView.vue`: se removió la tarjeta KPI "Insumos en
  alerta" y el panel completo "Alertas de stock" (enlazaban a la ruta
  nombrada `inventario`, que al desaparecer rompía el render de todo el
  Dashboard con un `No match for {"name":"inventario"}` no controlado). El
  composable `useReportes` conserva `alertasStock`/`loadAlertasStock` sin
  usar, listos para cuando se retome este backlog.
- Backend (`GET/POST/PUT/PATCH/DELETE /insumos`, `POST
  /insumos/{id}/ajustar-stock`) sigue funcionando normalmente, sin cambios.

## Criterios de aceptación

- [ ] Planner define el nuevo enfoque de Inventario (o decide retirarlo
      definitivamente).
- [ ] Se reactiva el link en el sidebar y la ruta solo cuando haya un diseño
      aprobado.
