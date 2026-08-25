<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { clearToken } from '../../composables/useAuth'

interface NavItem {
  to: string
  label: string
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/productos', label: 'Productos' },
  { to: '/mesas', label: 'Mesas' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/contabilidad', label: 'Contabilidad' },
  { to: '/categorias', label: 'Categorías' },
]

function onLogout() {
  clearToken()
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">BrainFreeze</div>

    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="nav-item--active"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <RouterLink to="/login" class="logout" @click="onLogout">Cerrar sesión</RouterLink>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  height: 100svh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border-soft);
}

.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-cyan);
  padding: 0 10px 20px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(123, 44, 191, 0.14);
  color: var(--color-text);
}

.nav-item--active {
  background: rgba(178, 255, 5, 0.14);
  color: var(--color-lime);
}

.logout {
  margin-top: auto;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 14px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 14px;
}

.logout:hover {
  color: var(--color-magenta);
}
</style>
