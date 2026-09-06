<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { clearToken, clearUserEmail, getUserEmail } from '../../composables/useAuth'
import logoBrainFreeze from '../../assets/brand/logo-brainfreeze.jpeg'

type NavAccent = 'cyan' | 'lime' | 'magenta' | 'purple'

interface NavItem {
  to: string
  label: string
  accent: NavAccent
  icon: string
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    accent: 'cyan',
    icon: '<rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect>',
  },
  {
    to: '/productos',
    label: 'Productos',
    accent: 'magenta',
    icon: '<path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3v5.59a2 2 0 0 0 .59 1.41l9.59 9.59a2 2 0 0 0 2.82 0l3.59-3.59a2 2 0 0 0 0-2.59z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle>',
  },
  {
    to: '/mesas',
    label: 'Mesas',
    accent: 'purple',
    icon: '<rect x="2" y="5" width="20" height="4" rx="1"></rect><path d="M5 9v10"></path><path d="M19 9v10"></path>',
  },
  {
    to: '/ventas',
    label: 'Ventas',
    accent: 'cyan',
    icon: '<circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"></path>',
  },
  {
    to: '/ordenes',
    label: 'Órdenes',
    accent: 'magenta',
    icon: '<path d="M6 2h12v19l-3-2-3 2-3-2-3 2V2z"></path><path d="M9 7h6"></path><path d="M9 11h6"></path><path d="M9 15h4"></path>',
  },
  {
    to: '/contabilidad',
    label: 'Contabilidad',
    accent: 'lime',
    icon: '<rect x="3" y="10" width="4" height="10"></rect><rect x="10" y="6" width="4" height="14"></rect><rect x="17" y="3" width="4" height="17"></rect>',
  },
  {
    to: '/categorias',
    label: 'Categorías',
    accent: 'magenta',
    icon: '<path d="M12 2 2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>',
  },
]

const accentBg: Record<NavAccent, string> = {
  cyan: 'rgba(0, 229, 255, 0.14)',
  lime: 'rgba(178, 255, 5, 0.14)',
  magenta: 'rgba(255, 0, 127, 0.14)',
  purple: 'rgba(123, 44, 191, 0.22)',
}

function navItemStyle(accent: NavAccent) {
  return {
    '--nav-accent-text': `var(--color-${accent})`,
    '--nav-accent-bg': accentBg[accent],
  }
}

const userEmail = computed(() => getUserEmail())
const userLabel = computed(() => userEmail.value ?? 'Administrador')
const userInitial = computed(() => (userEmail.value ? userEmail.value.trim().charAt(0).toUpperCase() : 'A'))

function onLogout() {
  clearToken()
  clearUserEmail()
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <img class="brand-logo" :src="logoBrainFreeze" alt="Logo BrainFreeze" width="30" height="30" />
      <span class="brand-text brand-gradient-text">BRAINFREEZEE</span>
    </div>

    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="nav-item--active"
        :style="navItemStyle(item.accent)"
      >
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="item.icon"
        ></svg>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="user-block">
        <span class="avatar brand-gradient-bg">{{ userInitial }}</span>
        <span class="user-label" :title="userLabel">{{ userLabel }}</span>
      </div>
      <RouterLink to="/login" class="logout" @click="onLogout">Cerrar sesión</RouterLink>
    </div>
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
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 20px;
}

.brand-logo {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.brand-text {
  font-weight: 700;
  letter-spacing: 0.04em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-item:hover {
  background: rgba(123, 44, 191, 0.14);
  color: var(--color-text);
}

.nav-item--active {
  background: var(--nav-accent-bg);
  color: var(--nav-accent-text);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--color-border-soft);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  min-width: 0;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
}

.user-label {
  font-size: 12.5px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
  border: 1px solid var(--color-border-soft);
}

.logout:hover {
  color: var(--color-magenta);
  border-color: var(--color-magenta);
}
</style>
