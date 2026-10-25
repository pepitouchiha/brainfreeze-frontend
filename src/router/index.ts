import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AuthLayout from '../layouts/AuthLayout.vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [{ path: '', redirect: '/login' }],
  },
  {
    path: '/login',
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [{ path: '', name: 'login', component: () => import('../views/LoginView.vue') }],
  },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
      },
      {
        path: 'inventario',
        redirect: '/dashboard',
      },
      {
        path: 'productos',
        name: 'productos',
        component: () => import('../views/ProductosView.vue'),
      },
      {
        path: 'mesas',
        name: 'mesas',
        component: () => import('../views/MesasView.vue'),
      },
      {
        path: 'ventas',
        name: 'ventas',
        component: () => import('../views/VentasView.vue'),
      },
      {
        path: 'ordenes',
        name: 'ordenes',
        component: () => import('../views/OrdenesView.vue'),
      },
      {
        path: 'historial',
        name: 'historial',
        component: () => import('../views/HistorialView.vue'),
      },
      {
        path: 'contabilidad',
        name: 'contabilidad',
        component: () => import('../views/ContabilidadView.vue'),
      },
      {
        path: 'categorias',
        name: 'categorias',
        component: () => import('../views/CategoriasView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && isAuthenticated()) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
