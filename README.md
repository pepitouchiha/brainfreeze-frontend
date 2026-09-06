# BrainFreeze — Frontend

Interfaz web de BrainFreeze, un sistema de punto de venta para una heladería/granizadería: login, catálogo de categorías/productos (con imagen), inventario, mesas (con pedidos progresivos), punto de venta (POS), historial de órdenes y dashboard de contabilidad.

Construido con **Vue 3 + TypeScript + Vite + Vue Router**, consumiendo el [backend de BrainFreeze](../backend) vía una API REST. Identidad visual neón propia (logo, tipografía con degradado, acentos de color por sección) y componentes de interacción construidos a mano — modales, toasts, switch, stepper numérico — sin ninguna librería de UI de terceros.

## Stack

- Vue 3 (`<script setup>`)
- TypeScript
- Vite
- Vue Router (con guard de autenticación)
- Sin librerías de UI/estado adicionales — cliente HTTP propio sobre `fetch`, tokens CSS para la paleta de diseño

## Estructura

```
src/
  api/                 # cliente HTTP tipado (client.ts) + un módulo por recurso (auth, categorias, productos, insumos, mesas, ventas, reportes)
  composables/         # lógica de estado reutilizable por vista (useAuth, useCategorias, useProductos, useCarrito, useToast, ...)
  layouts/             # AuthLayout (login) y DefaultLayout (con sidebar)
  components/
    layout/            # AppSidebar (logo, nav con iconos y acentos por sección, usuario/logout)
    common/            # BaseModal, ConfirmModal (con variante danger/primary), ToastContainer, ToggleSwitch, NumberInput, ProductoThumbnail — controles propios, sin librerías
    icons/             # iconos SVG a mano (lápiz, basurita, ojo, cancelar, billete, transferencia, chevrones) reutilizados en toda la app
    PedidoEnCursoModal.vue  # panel del pedido progresivo de una mesa abierta: agregar/quitar productos, cobrar o descartar
  views/               # una vista por pantalla (Login, Categorias, Productos, Inventario, Mesas, Ventas/POS, Órdenes, Dashboard, Contabilidad)
  router/              # rutas + guard que redirige a /login sin token
  utils/               # formatCOP() para montos en pesos colombianos
  assets/
    styles/            # tokens.css (paleta neón + utilidades como .brand-gradient-text) + base.css
    brand/             # logo de BrainFreeze
```

## Setup

```powershell
npm install
copy .env.example .env    # ajustar VITE_API_URL si el backend no corre en localhost:8000
npm run dev
```

Abrir `http://localhost:5173`. El backend debe estar corriendo (ver [`../backend`](../backend)) para poder loguearse y ver datos reales.

## Variables de entorno

Ver `.env.example`:

| Variable       | Descripción                                  |
|----------------|-----------------------------------------------|
| `VITE_API_URL` | URL base del backend (default: `http://localhost:8000`) |

## Scripts

```powershell
npm run dev       # servidor de desarrollo
npm run build     # type-check (vue-tsc) + build de producción
npm run preview   # sirve el build de producción localmente
```

## Funcionalidades destacadas

- **CRUD con popups**: crear/editar en Categorías, Productos, Inventario y Mesas abre un modal (`BaseModal`) en vez de un formulario inline; eliminar pide confirmación en un modal aparte (`ConfirmModal`).
- **Toasts**: cada creación/edición/eliminación exitosa muestra una notificación temporal (`useToast` + `ToastContainer`), sin bloquear la UI.
- **Imagen de producto**: se sube como archivo, se codifica a base64 en el navegador y se guarda así en el backend; hay preview en el formulario y miniatura en la tabla y en el catálogo del POS.
- **Controles propios**: switch para el estado Disponible/Agotado de un producto (con toggle rápido directo en la tabla), y un stepper con flechas propias para los campos numéricos (reemplaza las flechas nativas del navegador).
- **Método de pago**: segmented control (Efectivo en verde, Transferencia en naranja) en vez de radio buttons, en el carrito de Ventas y al cerrar un pedido de mesa.
- **Ventas (POS)**: al confirmar una venta aparece un popup de revisión (resumen de items/total/mesa/método de pago) antes de registrarla, y un toast de éxito al confirmar — sin pantalla de ticket aparte.
- **Mesas con pedidos progresivos**: abrir una mesa crea un pedido vacío al que se le van agregando/quitando productos mientras la gente sigue pidiendo (`PedidoEnCursoModal`), hasta cobrarlo (pide método de pago) o descartarlo. "Marcar libre" se deshabilita mientras la mesa tenga un pedido abierto sin cerrar. Mesas también se pueden renombrar o eliminar (bloqueado si tienen ventas asociadas).
- **Órdenes**: historial de ventas ya confirmadas con filtros (fecha, mesa, estado), detalle de cada una, edición de items/mesa/método de pago, y cancelación (soft-delete, libera la mesa si aplica) — los pedidos todavía abiertos no aparecen aquí hasta cerrarse.

## Proyecto

Este frontend se construyó de forma iterativa con un flujo planner → frontend-dev → reviewer; el historial de tareas (objetivo, criterios de aceptación, decisiones tomadas y revisión) queda documentado en [`tasks/`](./tasks).
