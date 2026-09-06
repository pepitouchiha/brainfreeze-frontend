---
id: FE-041
title: Popup de productos al hacer clic en una categoría
area: frontend
status: done
priority: medium
depends_on: [FE-003, FE-004]
created_by: user
---

## Objetivo

Desde la pantalla de Categorías, permitir ver rápidamente qué productos tiene
asociados una categoría sin tener que ir a Productos y filtrar manualmente.

## Alcance

- Clic en una tarjeta de categoría (fuera de los botones de editar/eliminar)
  abre un popup con los productos de esa categoría (miniatura, nombre,
  precio), usando `GET /productos?categoria_id=`.
- Si la categoría no tiene productos, muestra un mensaje en vez de una lista
  vacía.
- Editar y eliminar siguen funcionando sin disparar el popup.

## Criterios de aceptación

- [x] Clic en la tarjeta abre el popup con los productos correctos de esa
      categoría.
- [x] Categoría sin productos muestra "Esta categoría todavía no tiene
      productos asociados."
- [x] Clic en los íconos de editar/eliminar no abre el popup
      (`@click.stop`).

## Notas de implementación

### Archivos tocados

- `src/views/CategoriasView.vue` — nuevo estado `viewingCategoria` +
  `openProductos`/`closeProductos`, reutiliza `useProductos()` (composable ya
  existente) filtrando por `categoria_id`, y un `BaseModal` con la lista
  (`ProductoThumbnail` + `formatCOP`, mismo patrón visual que el catálogo de
  `PedidoEnCursoModal.vue`).
