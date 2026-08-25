<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMesas } from '../composables/useMesas'
import type { Mesa } from '../api/types'

const router = useRouter()
const { mesas, isLoading, loadError, load, create, liberar, messageFor } = useMesas()

const isFormOpen = ref(false)
const nombre = ref('')
const formError = ref('')
const isSaving = ref(false)

const liberandoId = ref<number | null>(null)
const liberarErrorFor = ref<Record<number, string>>({})

onMounted(load)

function openCreateForm() {
  nombre.value = ''
  formError.value = ''
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  formError.value = ''
}

async function onSubmit() {
  if (!nombre.value.trim()) {
    formError.value = 'El nombre o número es obligatorio.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    await create({ nombre_o_numero: nombre.value.trim() })
    closeForm()
  } catch (err) {
    formError.value = messageFor(err, 'No fue posible crear la mesa.')
  } finally {
    isSaving.value = false
  }
}

async function onLiberar(mesa: Mesa) {
  delete liberarErrorFor.value[mesa.id]
  liberandoId.value = mesa.id
  try {
    await liberar(mesa.id)
  } catch (err) {
    liberarErrorFor.value[mesa.id] = messageFor(err, 'No fue posible liberar la mesa.')
  } finally {
    liberandoId.value = null
  }
}

function onIniciarVenta(mesa: Mesa) {
  router.push({ name: 'ventas', query: { mesaId: String(mesa.id) } })
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Mesas</h1>
      <button type="button" class="btn-primary" @click="openCreateForm">+ Nueva mesa</button>
    </header>

    <form v-if="isFormOpen" class="mesa-form" @submit.prevent="onSubmit">
      <h2>Nueva mesa</h2>

      <div class="form-row">
        <label for="mesa-nombre">Nombre o número</label>
        <input
          id="mesa-nombre"
          v-model="nombre"
          type="text"
          placeholder="Ej. Mesa 4"
          :disabled="isSaving"
        />
      </div>

      <p v-if="formError" class="error" role="alert">{{ formError }}</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" :disabled="isSaving" @click="closeForm">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="isSaving">
          {{ isSaving ? 'Creando…' : 'Crear' }}
        </button>
      </div>
    </form>

    <p v-if="isLoading" class="status">Cargando mesas…</p>
    <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="mesas.length === 0" class="status">Todavía no hay mesas creadas.</p>

    <ul v-else class="mesa-list">
      <li v-for="mesa in mesas" :key="mesa.id" class="mesa-card">
        <div class="mesa-header">
          <span class="mesa-name">{{ mesa.nombre_o_numero }}</span>
          <span class="mesa-badge" :class="`mesa-badge--${mesa.estado}`">
            {{ mesa.estado === 'libre' ? 'Libre' : 'Ocupada' }}
          </span>
        </div>

        <div class="mesa-actions">
          <button type="button" class="btn-secondary" @click="onIniciarVenta(mesa)">
            Iniciar venta
          </button>
          <button
            type="button"
            class="btn-link"
            :disabled="mesa.estado === 'libre' || liberandoId === mesa.id"
            @click="onLiberar(mesa)"
          >
            {{ liberandoId === mesa.id ? 'Liberando…' : 'Marcar libre' }}
          </button>
        </div>

        <p v-if="liberarErrorFor[mesa.id]" class="error error--inline" role="alert">
          {{ liberarErrorFor[mesa.id] }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-header h1 {
  margin: 0;
  font-size: 22px;
  color: var(--color-text);
}

.btn-primary {
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 13.5px;
  color: #fff;
  background: linear-gradient(90deg, var(--color-purple), var(--color-purple-deep));
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 6px;
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mesa-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  max-width: 360px;
}

.mesa-form h2 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.form-row input {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.status {
  color: var(--color-text-muted);
  font-size: 14px;
}

.error {
  color: var(--color-danger);
  font-size: 13px;
  margin: 0;
}

.error--inline {
  margin-top: 8px;
}

.mesa-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.mesa-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.mesa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mesa-name {
  font-size: 14.5px;
  color: var(--color-text);
}

.mesa-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.mesa-badge--libre {
  color: var(--color-lime);
  background: rgba(178, 255, 5, 0.14);
  border: 1px solid rgba(178, 255, 5, 0.4);
}

.mesa-badge--ocupada {
  color: var(--color-magenta);
  background: rgba(255, 0, 127, 0.14);
  border: 1px solid rgba(255, 0, 127, 0.4);
}

.mesa-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
