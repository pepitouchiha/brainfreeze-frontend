<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useInsumos } from '../composables/useInsumos'
import { useCategorias } from '../composables/useCategorias'
import { useToast } from '../composables/useToast'
import BaseModal from '../components/common/BaseModal.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import IconPencil from '../components/icons/IconPencil.vue'
import IconTrash from '../components/icons/IconTrash.vue'
import NumberInput from '../components/common/NumberInput.vue'
import type { Insumo } from '../api/types'

const { insumos, isLoading, loadError, load, create, update, ajustarStock, remove, messageFor } =
  useInsumos()
const { categorias, load: loadCategorias } = useCategorias()
const { push: pushToast } = useToast()

const alertCount = computed(
  () => insumos.value.filter((i) => i.estado === 'Bajo' || i.estado === 'Crítico').length,
)

onMounted(() => {
  loadCategorias()
  load()
})

function categoriaNombre(categoriaId: number): string {
  return categorias.value.find((c) => c.id === categoriaId)?.nombre ?? 'Sin categoría'
}

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ nombre: '', categoria_id: '' as number | '', stock_minimo: '' as number | '' })
const formError = ref('')
const isSaving = ref(false)

function openCreateForm() {
  editingId.value = null
  form.nombre = ''
  form.categoria_id = ''
  form.stock_minimo = ''
  formError.value = ''
  isFormOpen.value = true
}

function openEditForm(insumo: Insumo) {
  editingId.value = insumo.id
  form.nombre = insumo.nombre
  form.categoria_id = insumo.categoria_id
  form.stock_minimo = insumo.stock_minimo
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
  if (form.stock_minimo === '' || Number(form.stock_minimo) < 0) {
    formError.value = 'El stock mínimo debe ser 0 o mayor.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    if (editingId.value === null) {
      await create({
        nombre: form.nombre.trim(),
        categoria_id: Number(form.categoria_id),
        stock_minimo: Number(form.stock_minimo),
      })
      pushToast('Insumo creado')
    } else {
      await update(editingId.value, {
        nombre: form.nombre.trim(),
        categoria_id: Number(form.categoria_id),
        stock_minimo: Number(form.stock_minimo),
      })
      pushToast('Insumo actualizado')
    }
    closeForm()
    await load()
  } catch (err) {
    formError.value = messageFor(err, 'No fue posible guardar el insumo.')
  } finally {
    isSaving.value = false
  }
}

const deletingId = ref<number | null>(null)
const deleteErrorFor = reactive<Record<number, string>>({})
const pendingDelete = ref<Insumo | null>(null)

function requestDelete(insumo: Insumo) {
  pendingDelete.value = insumo
}

function cancelDelete() {
  pendingDelete.value = null
}

async function confirmDelete() {
  const insumo = pendingDelete.value
  if (!insumo) return

  delete deleteErrorFor[insumo.id]
  deletingId.value = insumo.id
  try {
    await remove(insumo.id)
    pendingDelete.value = null
    pushToast('Insumo eliminado')
    await load()
  } catch (err) {
    deleteErrorFor[insumo.id] = messageFor(err, 'No fue posible eliminar el insumo.')
    pendingDelete.value = null
  } finally {
    deletingId.value = null
  }
}

const ajusteAbiertoId = ref<number | null>(null)
const ajusteCantidad = reactive<Record<number, number | ''>>({})
const ajusteErrorFor = reactive<Record<number, string>>({})
const ajustandoId = ref<number | null>(null)

function toggleAjuste(insumo: Insumo) {
  if (ajusteAbiertoId.value === insumo.id) {
    ajusteAbiertoId.value = null
    return
  }
  ajusteAbiertoId.value = insumo.id
  ajusteCantidad[insumo.id] = ''
  delete ajusteErrorFor[insumo.id]
}

async function onAjustar(insumo: Insumo, signo: 1 | -1) {
  const crudo = ajusteCantidad[insumo.id]
  const valor = Number(crudo)
  if (!crudo || Number.isNaN(valor) || valor <= 0) {
    ajusteErrorFor[insumo.id] = 'Ingresa una cantidad mayor a 0.'
    return
  }

  ajustandoId.value = insumo.id
  delete ajusteErrorFor[insumo.id]
  try {
    await ajustarStock(insumo.id, valor * signo)
    ajusteAbiertoId.value = null
  } catch (err) {
    ajusteErrorFor[insumo.id] = messageFor(err, 'No fue posible ajustar el stock.')
  } finally {
    ajustandoId.value = null
  }
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Inventario</h1>
      <button type="button" class="btn-primary" @click="openCreateForm">+ Nuevo insumo</button>
    </header>

    <p class="counter">{{ insumos.length }} referencias · {{ alertCount }} con stock bajo o crítico</p>

    <BaseModal v-if="isFormOpen" @close="closeForm">
      <form class="insumo-form" @submit.prevent="onSubmit">
        <h2>{{ editingId === null ? 'Nuevo insumo' : 'Editar insumo' }}</h2>

        <div class="form-row">
          <label for="insumo-nombre">Nombre</label>
          <input
            id="insumo-nombre"
            v-model="form.nombre"
            type="text"
            placeholder="Ej. Jarabe de fresa"
            :disabled="isSaving"
          />
        </div>

        <div class="form-row">
          <label for="insumo-categoria">Categoría</label>
          <select id="insumo-categoria" v-model="form.categoria_id" :disabled="isSaving">
            <option value="" disabled>Selecciona una categoría</option>
            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.nombre }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="insumo-minimo">Stock mínimo</label>
          <NumberInput
            id="insumo-minimo"
            v-model="form.stock_minimo"
            :min="0"
            step="any"
            placeholder="Ej. 5"
            :disabled="isSaving"
          />
        </div>

        <p v-if="editingId === null" class="hint">
          El stock inicial queda en 0; usa "Ajustar stock" en la lista para registrar la entrada
          inicial una vez creado.
        </p>

        <p v-if="formError" class="error" role="alert">{{ formError }}</p>

        <div class="form-actions">
          <button type="button" class="btn-secondary" :disabled="isSaving" @click="closeForm">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <p v-if="isLoading" class="status">Cargando inventario…</p>
    <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="insumos.length === 0" class="status">Todavía no hay insumos registrados.</p>

    <table v-else class="insumo-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Stock</th>
          <th>Mínimo</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="insumo in insumos" :key="insumo.id">
          <tr>
            <td>{{ insumo.nombre }}</td>
            <td>{{ categoriaNombre(insumo.categoria_id) }}</td>
            <td>{{ insumo.stock }}</td>
            <td>{{ insumo.stock_minimo }}</td>
            <td>
              <span class="tag" :class="`tag--${insumo.estado === 'OK' ? 'ok' : insumo.estado === 'Bajo' ? 'bajo' : 'critico'}`">
                {{ insumo.estado }}
              </span>
            </td>
            <td class="actions-cell">
              <div class="actions-inner">
                <button type="button" class="btn-link" @click="toggleAjuste(insumo)">
                  {{ ajusteAbiertoId === insumo.id ? 'Cancelar ajuste' : 'Ajustar stock' }}
                </button>
                <button
                  type="button"
                  class="btn-link"
                  aria-label="Editar insumo"
                  title="Editar insumo"
                  @click="openEditForm(insumo)"
                >
                  <IconPencil />
                </button>
                <button
                  type="button"
                  class="btn-link btn-link--danger"
                  :disabled="deletingId === insumo.id"
                  :aria-label="deletingId === insumo.id ? 'Eliminando insumo…' : 'Eliminar insumo'"
                  :title="deletingId === insumo.id ? 'Eliminando insumo…' : 'Eliminar insumo'"
                  :aria-busy="deletingId === insumo.id"
                  @click="requestDelete(insumo)"
                >
                  <IconTrash />
                </button>
                <p v-if="deleteErrorFor[insumo.id]" class="error error--inline" role="alert">
                  {{ deleteErrorFor[insumo.id] }}
                </p>
              </div>
            </td>
          </tr>
          <tr v-if="ajusteAbiertoId === insumo.id" class="ajuste-row">
            <td colspan="6">
              <div class="ajuste-box">
                <label :for="`ajuste-cantidad-${insumo.id}`">Cantidad</label>
                <NumberInput
                  :id="`ajuste-cantidad-${insumo.id}`"
                  v-model="ajusteCantidad[insumo.id]"
                  :min="0"
                  step="any"
                  placeholder="Ej. 10"
                  :disabled="ajustandoId === insumo.id"
                />
                <button
                  type="button"
                  class="btn-secondary btn-ajuste btn-ajuste--entrada"
                  :disabled="ajustandoId === insumo.id"
                  @click="onAjustar(insumo, 1)"
                >
                  + Entrada
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-ajuste btn-ajuste--salida"
                  :disabled="ajustandoId === insumo.id"
                  @click="onAjustar(insumo, -1)"
                >
                  − Salida
                </button>
                <p v-if="ajusteErrorFor[insumo.id]" class="error" role="alert">
                  {{ ajusteErrorFor[insumo.id] }}
                </p>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <ConfirmModal
      v-if="pendingDelete"
      title="Eliminar insumo"
      :message="`¿Eliminar el insumo «${pendingDelete.nombre}»? Esta acción no se puede deshacer.`"
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
  padding: 8px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.counter {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.insumo-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.insumo-form h2 {
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

.hint {
  margin: 0;
  font-size: 12px;
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
  margin-top: 6px;
}

.insumo-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.insumo-table th,
.insumo-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 13.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-soft);
}

.insumo-table th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.insumo-table tbody tr:last-child td {
  border-bottom: none;
}

.actions-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.tag--ok {
  color: var(--color-lime);
  background: rgba(178, 255, 5, 0.14);
  border: 1px solid rgba(178, 255, 5, 0.4);
}

.tag--bajo {
  color: var(--color-cyan);
  background: rgba(0, 229, 255, 0.14);
  border: 1px solid rgba(0, 229, 255, 0.4);
}

.tag--critico {
  color: var(--color-danger);
  background: rgba(255, 77, 109, 0.14);
  border: 1px solid rgba(255, 77, 109, 0.4);
}

.ajuste-row td {
  background: var(--color-surface-alt);
  padding: 14px 16px;
}

.ajuste-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.ajuste-box label {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.ajuste-box :deep(.number-input) {
  width: 160px;
}

.btn-ajuste--entrada {
  color: var(--color-lime);
  border-color: rgba(178, 255, 5, 0.4);
}

.btn-ajuste--salida {
  color: var(--color-danger);
  border-color: rgba(255, 77, 109, 0.4);
}
</style>
