---
id: FE-042
title: Selector de imagen de producto con estilo propio
area: frontend
status: done
priority: low
depends_on: [FE-017]
created_by: user
---

## Objetivo

El input nativo de archivo (`<input type="file">`) en el formulario de
Productos desentonaba con el resto de controles hechos a mano de la app
(switch, stepper, modales) — texto y estilo del botón controlados por el
navegador/idioma del sistema operativo.

## Alcance

- Ocultar el input nativo (visualmente, sigue siendo funcional y accesible)
  y reemplazarlo por un botón propio ("Elegir imagen") con el estilo de
  marca, que dispara el selector de archivos al hacer clic.
- Mostrar el nombre del archivo elegido junto al botón (o "Ningún archivo
  seleccionado").

## Criterios de aceptación

- [x] El botón "Elegir imagen" abre el diálogo de selección de archivo del
      sistema operativo.
- [x] El nombre del archivo elegido se muestra junto al botón.
- [x] Al quitar la imagen o abrir el formulario para crear/editar otro
      producto, el nombre mostrado se limpia correctamente.

## Notas de implementación

### Archivos tocados

- `src/views/ProductosView.vue` — nuevo estado `imagenFileName` +
  `triggerFileInput()` (llama a `fileInputRef.value?.click()`); el
  `<input type="file">` se oculta con una clase `.file-input-hidden`
  (clip-path, no `display:none`, para mantenerlo accesible/enfocable) en vez
  de eliminarlo del DOM.
