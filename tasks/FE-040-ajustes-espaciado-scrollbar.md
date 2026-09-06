---
id: FE-040
title: Ajustes de espaciado y scrollbar a juego con la marca
area: frontend
status: done
priority: low
depends_on: []
created_by: user
---

## Objetivo

Pulir varios detalles visuales reportados por el dueño del negocio al usar la
app: elementos pegados al borde de contenedores con scroll, y la barra de
scroll gris por defecto del navegador desentonando con la identidad neón.

## Alcance

- Espacio entre el botón `+` de agregar producto y la barra de scroll en el
  panel de pedido en curso de Mesas.
- Espacio entre el texto y el tag "Estimado parcial" en Contabilidad (ganancia
  del año en curso).
- Barra de scroll personalizada a nivel global, a juego con la paleta de
  marca.

## Criterios de aceptación

- [x] El botón `+` en "Agregar producto" (Mesas) ya no queda pegado a la
      barra de scroll.
- [x] El tag "Estimado parcial" en Contabilidad tiene separación del texto
      que lo precede.
- [x] Toda la app usa una barra de scroll con los colores de marca (morado,
      cian al hover) en vez de la barra gris nativa, con fallback para
      Firefox (`scrollbar-width`/`scrollbar-color`).

## Notas de implementación

### Archivos tocados

- `src/components/PedidoEnCursoModal.vue` — `padding-right: 10px` en
  `.catalogo-lista`.
- `src/views/ContabilidadView.vue` — regla `.ytd .tag { margin-left: 8px }`
  (no se tocó `.margen-cell`, que ya usaba `gap` para el mismo tag dentro de
  la tabla mensual).
- `src/assets/styles/base.css` — reglas `::-webkit-scrollbar*` +
  `scrollbar-width`/`scrollbar-color`, usando los tokens `--color-purple`,
  `--color-cyan` y `--color-surface-alt` de `tokens.css`.
