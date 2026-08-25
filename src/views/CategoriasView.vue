<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useCategorias } from '../composables/useCategorias'
import type { Categoria } from '../api/types'

const { categorias, isLoading, loadError, load, create, update, remove, messageFor } = useCategorias()

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ nombre: '', color: '#6b7280' })
const formError = ref('')
const isSaving = ref(false)

const deletingId = ref<number | null>(null)
const deleteErrorFor = reactive<Record<number, string>>({})

onMounted(load)

function openCreateForm() {
  editingId.value = null
  form.nombre = ''
  form.color = '#6b7280'
  formError.value = ''
  isFormOpen.value = true
}

function openEditForm(categoria: Categoria) {
  editingId.value = categoria.id
  form.nombre = categoria.nombre
  form.color = categoria.color
  formError.value = ''
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  editingId.value = null
  formError.value = ''
}

async function onSubmit() {
  if (!form.nombre.trim()) {
    formError.value = 'El nombre es obligatorio.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    if (editingId.value === null) {
      await create({ nombre: form.nombre.trim(), color: form.color })
    } else {
      await update(editingId.value, { nombre: form.nombre.trim(), color: form.color })
    }
    closeForm()
  } catch (err) {
    formError.value = messageFor(err, 'No fue posible guardar la categoría.')
  } finally {
    isSaving.value = false
  }
}

async function onDelete(categoria: Categoria) {
  delete deleteErrorFor[categoria.id]
  deletingId.value = categoria.id
  try {
    await remove(categoria.id)
  } catch (err) {
    deleteErrorFor[categoria.id] = messageFor(
      err,
      'No fue posible eliminar la categoría.',
    )
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Categorías</h1>
      <button type="button" class="btn-primary" @click="openCreateForm">+ Nueva categoría</button>
    </header>

    <form v-if="isFormOpen" class="category-form" @submit.prevent="onSubmit">
      <h2>{{ editingId === null ? 'Nueva categoría' : 'Editar categoría' }}</h2>

      <div class="form-row">
        <label for="cat-nombre">Nombre</label>
        <input id="cat-nombre" v-model="form.nombre" type="text" placeholder="Ej. Granizados" :disabled="isSaving" />
      </div>

      <div class="form-row">
        <label for="cat-color">Color</label>
        <div class="color-row">
          <input id="cat-color" v-model="form.color" type="color" :disabled="isSaving" />
          <span class="color-value">{{ form.color }}</span>
        </div>
      </div>

      <p v-if="formError" class="error" role="alert">{{ formError }}</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" :disabled="isSaving" @click="closeForm">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="isSaving">
          {{ isSaving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>

    <p v-if="isLoading" class="status">Cargando categorías…</p>
    <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="categorias.length === 0" class="status">Todavía no hay categorías creadas.</p>

    <ul v-else class="category-list">
      <li v-for="categoria in categorias" :key="categoria.id" class="category-card">
        <span class="swatch" :style="{ backgroundColor: categoria.color }"></span>
        <div class="category-info">
          <span class="category-name">{{ categoria.nombre }}</span>
          <span class="category-count">{{ categoria.productos_count }} producto(s)</span>
        </div>
        <div class="category-actions">
          <button type="button" class="btn-link" @click="openEditForm(categoria)">Editar</button>
          <button
            type="button"
            class="btn-link btn-link--danger"
            :disabled="deletingId === categoria.id"
            @click="onDelete(categoria)"
          >
            {{ deletingId === categoria.id ? 'Eliminando…' : 'Eliminar' }}
          </button>
        </div>
        <p v-if="deleteErrorFor[categoria.id]" class="error error--inline" role="alert">
          {{ deleteErrorFor[categoria.id] }}
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
  padding: 10px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13.5px;
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

.btn-link--danger {
  color: var(--color-danger);
}

.btn-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.category-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  max-width: 420px;
}

.category-form h2 {
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

.form-row input[type='text'] {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-row input[type='color'] {
  width: 44px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  padding: 2px;
  cursor: pointer;
}

.color-value {
  font-size: 13px;
  color: var(--color-text-muted);
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
  width: 100%;
  margin-top: 6px;
}

.category-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.category-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.category-name {
  font-size: 14.5px;
  color: var(--color-text);
}

.category-count {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.category-actions {
  display: flex;
  gap: 4px;
}
</style>
