<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useProductos } from '../composables/useProductos'
import { useCategorias } from '../composables/useCategorias'
import { useToast } from '../composables/useToast'
import BaseModal from '../components/common/BaseModal.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import ProductoThumbnail from '../components/common/ProductoThumbnail.vue'
import ToggleSwitch from '../components/common/ToggleSwitch.vue'
import NumberInput from '../components/common/NumberInput.vue'
import IconPencil from '../components/icons/IconPencil.vue'
import IconTrash from '../components/icons/IconTrash.vue'
import { formatCOP } from '../utils/currency'
import type { EstadoProducto, Producto } from '../api/types'
import type { ListProductosParams } from '../api/productos'

const MAX_IMAGEN_BYTES = 500 * 1024

const { productos, total, isLoading, loadError, loadTotal, load, create, update, remove, messageFor } =
  useProductos()
const { categorias, load: loadCategorias } = useCategorias()
const { push: pushToast } = useToast()

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
  costo: '' as number | '',
  estado: 'disponible' as EstadoProducto,
  imagenBase64: null as string | null,
})
const imagenTouched = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const formError = ref('')
const isSaving = ref(false)

const formEstadoDisponible = computed<boolean>({
  get: () => form.estado === 'disponible',
  set: (value) => {
    form.estado = value ? 'disponible' : 'agotado'
  },
})

const estadoUpdating = reactive<Record<number, boolean>>({})

const deletingId = ref<number | null>(null)
const deleteErrorFor = reactive<Record<number, string>>({})
const pendingDelete = ref<Producto | null>(null)

onMounted(() => {
  loadCategorias()
  loadTotal()
  refresh()
})

function categoriaNombre(categoriaId: number): string {
  return categorias.value.find((c) => c.id === categoriaId)?.nombre ?? 'Sin categoría'
}

function margenFor(producto: Producto): number | null {
  if (producto.costo === null) return null
  return producto.precio - producto.costo
}

function openCreateForm() {
  editingId.value = null
  form.nombre = ''
  form.categoria_id = categoriaFiltro.value !== '' ? categoriaFiltro.value : ''
  form.precio = ''
  form.costo = ''
  form.estado = 'disponible'
  form.imagenBase64 = null
  imagenTouched.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
  formError.value = ''
  isFormOpen.value = true
}

function openEditForm(producto: Producto) {
  editingId.value = producto.id
  form.nombre = producto.nombre
  form.categoria_id = producto.categoria_id
  form.precio = producto.precio
  form.costo = producto.costo ?? ''
  form.estado = producto.estado
  form.imagenBase64 = producto.imagen_base64
  imagenTouched.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
  formError.value = ''
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  editingId.value = null
  formError.value = ''
}

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > MAX_IMAGEN_BYTES) {
    formError.value = 'La imagen supera el tamaño máximo permitido (500KB).'
    input.value = ''
    return
  }

  formError.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    form.imagenBase64 = reader.result as string
    imagenTouched.value = true
  }
  reader.readAsDataURL(file)
}

function onRemoveImage() {
  form.imagenBase64 = null
  imagenTouched.value = true
  if (fileInputRef.value) fileInputRef.value.value = ''
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
  if (form.costo !== '' && Number(form.costo) < 0) {
    formError.value = 'El costo no puede ser negativo.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    const payload = {
      nombre: form.nombre.trim(),
      categoria_id: Number(form.categoria_id),
      precio: Number(form.precio),
      costo: form.costo === '' ? null : Number(form.costo),
      estado: form.estado,
      imagen_base64: imagenTouched.value ? form.imagenBase64 : undefined,
    }
    if (editingId.value === null) {
      await create(payload)
      pushToast('Producto creado')
    } else {
      await update(editingId.value, payload)
      pushToast('Producto actualizado')
    }
    closeForm()
    await Promise.all([refresh(), loadTotal()])
  } catch (err) {
    formError.value = messageFor(err, 'No fue posible guardar el producto.')
  } finally {
    isSaving.value = false
  }
}

function requestDelete(producto: Producto) {
  pendingDelete.value = producto
}

function cancelDelete() {
  pendingDelete.value = null
}

async function confirmDelete() {
  const producto = pendingDelete.value
  if (!producto) return

  delete deleteErrorFor[producto.id]
  deletingId.value = producto.id
  try {
    await remove(producto.id)
    pendingDelete.value = null
    pushToast('Producto eliminado')
    await Promise.all([refresh(), loadTotal()])
  } catch (err) {
    deleteErrorFor[producto.id] = messageFor(err, 'No fue posible eliminar el producto.')
    pendingDelete.value = null
  } finally {
    deletingId.value = null
  }
}

async function onToggleEstado(producto: Producto, disponible: boolean) {
  const nuevoEstado: EstadoProducto = disponible ? 'disponible' : 'agotado'
  const anterior = producto.estado
  producto.estado = nuevoEstado
  estadoUpdating[producto.id] = true
  try {
    const actualizado = await update(producto.id, { estado: nuevoEstado })
    producto.estado = actualizado.estado
    pushToast('Estado actualizado')
  } catch (err) {
    producto.estado = anterior
    pushToast(messageFor(err, 'No fue posible actualizar el estado.'), 'error')
  } finally {
    delete estadoUpdating[producto.id]
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

    <BaseModal v-if="isFormOpen" @close="closeForm">
      <form class="producto-form" @submit.prevent="onSubmit">
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
          <NumberInput
            id="prod-precio"
            v-model="form.precio"
            :min="1"
            :step="1"
            placeholder="Ej. 5000"
            :disabled="isSaving"
          />
        </div>

        <div class="form-row">
          <label for="prod-costo">Costo (opcional)</label>
          <NumberInput
            id="prod-costo"
            v-model="form.costo"
            :min="0"
            :step="1"
            placeholder="Ej. 3000"
            :disabled="isSaving"
          />
        </div>

        <div class="form-row">
          <label for="prod-estado">Estado</label>
          <div class="estado-toggle">
            <ToggleSwitch id="prod-estado" v-model="formEstadoDisponible" :disabled="isSaving" aria-label="Estado del producto" />
            <span class="estado-toggle__label">{{ formEstadoDisponible ? 'Disponible' : 'Agotado' }}</span>
          </div>
        </div>

        <div class="form-row">
          <label for="prod-imagen">Imagen (opcional)</label>
          <input
            id="prod-imagen"
            ref="fileInputRef"
            type="file"
            accept="image/*"
            :disabled="isSaving"
            @change="onImageSelected"
          />
          <div v-if="form.imagenBase64" class="imagen-preview">
            <ProductoThumbnail :src="form.imagenBase64" alt="Vista previa de la imagen" variant="card" />
            <button type="button" class="btn-link btn-link--danger" :disabled="isSaving" @click="onRemoveImage">
              Quitar imagen
            </button>
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
    </BaseModal>

    <p v-if="isLoading" class="status">Cargando productos…</p>
    <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="productos.length === 0" class="status">No se encontraron productos.</p>

    <table v-else class="producto-table">
      <thead>
        <tr>
          <th></th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Margen</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="producto in productos" :key="producto.id">
          <td class="thumb-cell">
            <ProductoThumbnail :src="producto.imagen_base64" :alt="producto.nombre" variant="thumb" />
          </td>
          <td>{{ producto.nombre }}</td>
          <td>{{ categoriaNombre(producto.categoria_id) }}</td>
          <td>{{ formatCOP(producto.precio) }}</td>
          <td>
            <span v-if="producto.costo === null" class="margen margen--sin-definir" title="Costo no definido">
              N/D
            </span>
            <span v-else class="margen">{{ formatCOP(margenFor(producto)!) }}</span>
          </td>
          <td>
            <div class="estado-toggle">
              <ToggleSwitch
                :model-value="producto.estado === 'disponible'"
                :disabled="!!estadoUpdating[producto.id]"
                :aria-label="`Cambiar estado de ${producto.nombre}`"
                @update:model-value="(value) => onToggleEstado(producto, value)"
              />
              <span class="estado-toggle__label">
                {{ producto.estado === 'disponible' ? 'Disponible' : 'Agotado' }}
              </span>
            </div>
          </td>
          <td class="actions-cell">
            <div class="actions-inner">
              <button
                type="button"
                class="btn-link"
                aria-label="Editar producto"
                title="Editar producto"
                @click="openEditForm(producto)"
              >
                <IconPencil />
              </button>
              <button
                type="button"
                class="btn-link btn-link--danger"
                :disabled="deletingId === producto.id"
                :aria-label="deletingId === producto.id ? 'Eliminando producto…' : 'Eliminar producto'"
                :title="deletingId === producto.id ? 'Eliminando producto…' : 'Eliminar producto'"
                :aria-busy="deletingId === producto.id"
                @click="requestDelete(producto)"
              >
                <IconTrash />
              </button>
              <p v-if="deleteErrorFor[producto.id]" class="error error--inline" role="alert">
                {{ deleteErrorFor[producto.id] }}
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfirmModal
      v-if="pendingDelete"
      title="Eliminar producto"
      :message="`¿Eliminar el producto «${pendingDelete.nombre}»? Esta acción no se puede deshacer.`"
      :is-confirming="deletingId === pendingDelete.id"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-cyan);
  cursor: pointer;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-link:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.12);
  color: #5df2ff;
}

.btn-link:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.btn-link--danger {
  color: var(--color-danger);
}

.btn-link--danger:hover:not(:disabled) {
  background: rgba(255, 77, 109, 0.14);
  color: #ff7d91;
}

.btn-link--danger:focus-visible {
  outline-color: var(--color-danger);
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

.form-row input[type='file'] {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.imagen-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 220px;
}

.thumb-cell {
  width: 52px;
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

.actions-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.margen {
  font-variant-numeric: tabular-nums;
}

.margen--sin-definir {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 12.5px;
}

.estado-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.estado-toggle__label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
