<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useProductos } from '../composables/useProductos'
import { useCategorias } from '../composables/useCategorias'
import { formatCOP } from '../utils/currency'
import type { EstadoProducto, Producto } from '../api/types'
import type { ListProductosParams } from '../api/productos'

const { productos, total, isLoading, loadError, loadTotal, load, create, update, remove, messageFor } =
  useProductos()
const { categorias, load: loadCategorias } = useCategorias()

const search = ref('')
const categoriaFiltro = ref<number | ''>('')
let searchDebounce: ReturnType<typeof setTimeout> | undefined

function activeFilters(): ListProductosParams {
  return {
    search: search.value.trim() || undefined,
    categoria_id: categoriaFiltro.value === '' ? undefined : categoriaFiltro.value,
  }
}

function refresh(): Promise<void> {
  return load(activeFilters())
}

function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(refresh, 300)
}

function onCategoriaFiltroChange() {
  refresh()
}

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  nombre: '',
  categoria_id: '' as number | '',
  precio: '' as number | '',
  estado: 'disponible' as EstadoProducto,
})
const formError = ref('')
const isSaving = ref(false)

const deletingId = ref<number | null>(null)
const deleteErrorFor = reactive<Record<number, string>>({})

onMounted(() => {
  loadCategorias()
  loadTotal()
  refresh()
})

function categoriaNombre(categoriaId: number): string {
  return categorias.value.find((c) => c.id === categoriaId)?.nombre ?? 'Sin categoría'
}

function openCreateForm() {
  editingId.value = null
  form.nombre = ''
  form.categoria_id = categoriaFiltro.value !== '' ? categoriaFiltro.value : ''
  form.precio = ''
  form.estado = 'disponible'
  formError.value = ''
  isFormOpen.value = true
}

function openEditForm(producto: Producto) {
  editingId.value = producto.id
  form.nombre = producto.nombre
  form.categoria_id = producto.categoria_id
  form.precio = producto.precio
  form.estado = producto.estado
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
  if (form.categoria_id === '') {
    formError.value = 'Selecciona una categoría.'
    return
  }
  if (form.precio === '' || Number(form.precio) <= 0) {
    formError.value = 'El precio debe ser mayor a 0.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    const payload = {
      nombre: form.nombre.trim(),
      categoria_id: Number(form.categoria_id),
      precio: Number(form.precio),
      estado: form.estado,
    }
    if (editingId.value === null) {
      await create(payload)
    } else {
      await update(editingId.value, payload)
    }
    closeForm()
    await Promise.all([refresh(), loadTotal()])
  } catch (err) {
    formError.value = messageFor(err, 'No fue posible guardar el producto.')
  } finally {
    isSaving.value = false
  }
}

async function onDelete(producto: Producto) {
  delete deleteErrorFor[producto.id]
  deletingId.value = producto.id
  try {
    await remove(producto.id)
    await Promise.all([refresh(), loadTotal()])
  } catch (err) {
    deleteErrorFor[producto.id] = messageFor(err, 'No fue posible eliminar el producto.')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Productos</h1>
      <button type="button" class="btn-primary" @click="openCreateForm">+ Nuevo producto</button>
    </header>

    <div class="filters">
      <input
        v-model="search"
        type="text"
        class="search-input"
        placeholder="Buscar producto por nombre…"
        @input="onSearchInput"
      />
      <select v-model="categoriaFiltro" class="categoria-select" @change="onCategoriaFiltroChange">
        <option value="">Todas las categorías</option>
        <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
          {{ categoria.nombre }}
        </option>
      </select>
    </div>

    <p class="counter">{{ productos.length }} de {{ total }} productos</p>

    <form v-if="isFormOpen" class="producto-form" @submit.prevent="onSubmit">
      <h2>{{ editingId === null ? 'Nuevo producto' : 'Editar producto' }}</h2>

      <div class="form-row">
        <label for="prod-nombre">Nombre</label>
        <input
          id="prod-nombre"
          v-model="form.nombre"
          type="text"
          placeholder="Ej. Granizado Fresa Chico"
          :disabled="isSaving"
        />
      </div>

      <div class="form-row">
        <label for="prod-categoria">Categoría</label>
        <select id="prod-categoria" v-model="form.categoria_id" :disabled="isSaving">
          <option value="" disabled>Selecciona una categoría</option>
          <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
            {{ categoria.nombre }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="prod-precio">Precio (COP)</label>
        <input
          id="prod-precio"
          v-model.number="form.precio"
          type="number"
          min="1"
          step="1"
          placeholder="Ej. 5000"
          :disabled="isSaving"
        />
      </div>

      <div class="form-row">
        <label for="prod-estado">Estado</label>
        <select id="prod-estado" v-model="form.estado" :disabled="isSaving">
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
        </select>
      </div>

      <p v-if="formError" class="error" role="alert">{{ formError }}</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" :disabled="isSaving" @click="closeForm">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="isSaving">
          {{ isSaving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>

    <p v-if="isLoading" class="status">Cargando productos…</p>
    <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="productos.length === 0" class="status">No se encontraron productos.</p>

    <table v-else class="producto-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="producto in productos" :key="producto.id">
          <td>{{ producto.nombre }}</td>
          <td>{{ categoriaNombre(producto.categoria_id) }}</td>
          <td>{{ formatCOP(producto.precio) }}</td>
          <td>
            <span class="tag" :class="`tag--${producto.estado}`">
              {{ producto.estado === 'disponible' ? 'Disponible' : 'Agotado' }}
            </span>
          </td>
          <td class="actions-cell">
            <button type="button" class="btn-link" @click="openEditForm(producto)">Editar</button>
            <button
              type="button"
              class="btn-link btn-link--danger"
              :disabled="deletingId === producto.id"
              @click="onDelete(producto)"
            >
              {{ deletingId === producto.id ? 'Eliminando…' : 'Eliminar' }}
            </button>
            <p v-if="deleteErrorFor[producto.id]" class="error error--inline" role="alert">
              {{ deleteErrorFor[producto.id] }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
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

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 220px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
}

.categoria-select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
  min-width: 200px;
}

.counter {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.producto-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  max-width: 420px;
}

.producto-form h2 {
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

.form-row input,
.form-row select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
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
  margin-top: 6px;
}

.producto-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.producto-table th,
.producto-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 13.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-soft);
}

.producto-table th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.producto-table tbody tr:last-child td {
  border-bottom: none;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.tag--disponible {
  color: var(--color-lime);
  background: rgba(178, 255, 5, 0.14);
  border: 1px solid rgba(178, 255, 5, 0.4);
}

.tag--agotado {
  color: var(--color-danger);
  background: rgba(255, 77, 109, 0.14);
  border: 1px solid rgba(255, 77, 109, 0.4);
}
</style>
