<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../api/auth'
import { ApiError } from '../api/client'
import { setToken } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Correo y contraseña son obligatorios.'
    return
  }

  isSubmitting.value = true
  try {
    const response = await login({ email: email.value.trim(), password: password.value })
    setToken(response.access_token)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.push(redirect)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      errorMessage.value = 'Correo o contraseña incorrectos.'
    } else {
      errorMessage.value = 'No fue posible iniciar sesión. Intenta de nuevo.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="login-card">
    <div class="brand">BRAINFREEZEE</div>
    <p class="subtitle">Panel de gestión — acceso administrador</p>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label for="login-email">Correo electrónico</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="admin@brainfreezee.club"
          :disabled="isSubmitting"
        />
      </div>

      <div class="field">
        <label for="login-pass">Contraseña</label>
        <input
          id="login-pass"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          :disabled="isSubmitting"
        />
      </div>

      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

      <button type="submit" class="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Ingresando…' : 'Iniciar sesión' }}
      </button>
    </form>

    <p class="footer">Sala Brainfreezee · Sistema interno de gestión</p>
  </section>
</template>

<style scoped>
.login-card {
  width: min(380px, 90vw);
  padding: 38px 32px;
  border-radius: 20px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  box-shadow: 0 0 50px rgba(123, 44, 191, 0.35), 0 20px 50px rgba(0, 0, 0, 0.5);
}

.brand {
  font-weight: 700;
  font-size: 24px;
  letter-spacing: 0.01em;
  text-align: center;
  background: linear-gradient(90deg, var(--color-magenta), var(--color-purple) 55%, var(--color-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 26px;
  text-align: center;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 12.5px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 11px 13px;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: var(--color-cyan);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.18);
}

.field input:disabled {
  opacity: 0.6;
}

.error {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--color-danger);
}

.submit {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 14.5px;
  color: #fff;
  background: linear-gradient(90deg, var(--color-purple), var(--color-purple-deep));
  box-shadow: 0 0 24px rgba(123, 44, 191, 0.55);
}

.submit:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.footer {
  font-size: 11.5px;
  text-align: center;
  margin: 16px 0 0;
  color: var(--color-text-muted);
  opacity: 0.7;
}
</style>
