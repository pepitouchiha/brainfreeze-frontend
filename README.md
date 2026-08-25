# BrainFreeze — Frontend

Interfaz web de BrainFreeze, un sistema de punto de venta para una heladería/granizadería: login, catálogo de categorías/productos, inventario, mesas, punto de venta (POS) y dashboard de contabilidad.

Construido con **Vue 3 + TypeScript + Vite + Vue Router**, consumiendo el [backend de BrainFreeze](../backend) vía una API REST.

## Stack

- Vue 3 (`<script setup>`)
- TypeScript
- Vite
- Vue Router (con guard de autenticación)
- Sin librerías de UI/estado adicionales — cliente HTTP propio sobre `fetch`, tokens CSS para la paleta de diseño

## Estructura

```
src/
  api/            # cliente HTTP tipado (client.ts) + un módulo por recurso (auth, categorias, productos, insumos, mesas, ventas, reportes)
  composables/    # lógica de estado reutilizable por vista (useAuth, useCategorias, useProductos, useCarrito, ...)
  layouts/        # AuthLayout (login) y DefaultLayout (con sidebar)
  components/     # componentes compartidos (sidebar, placeholder de vista)
  views/          # una vista por pantalla (Login, Categorias, Productos, Inventario, Mesas, Ventas/POS, Dashboard, Contabilidad)
  router/         # rutas + guard que redirige a /login sin token
  utils/          # formatCOP() para montos en pesos colombianos
  assets/styles/  # tokens.css (paleta neón) + base.css
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

## Proyecto

Este frontend se construyó de forma iterativa con un flujo planner → frontend-dev → reviewer; el historial de tareas (objetivo, criterios de aceptación, decisiones tomadas y revisión) queda documentado en [`tasks/`](./tasks).
