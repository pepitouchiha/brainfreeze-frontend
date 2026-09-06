<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMesas } from '../composables/useMesas'
import { useVentas } from '../composables/useVentas'
import { useToast } from '../composables/useToast'
import { listVentas } from '../api/ventas'
import { ApiError } from '../api/client'
import BaseModal from '../components/common/BaseModal.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import IconPencil from '../components/icons/IconPencil.vue'
import IconTrash from '../components/icons/IconTrash.vue'
import PedidoEnCursoModal from '../components/PedidoEnCursoModal.vue'
import type { Mesa, Venta } from '../api/types'

const { mesas, isLoading, loadError, load, create, liberar, update, remove, messageFor } = useMesas()
const { abrirPedido } = useVentas()
const { push: pushToast } = useToast()

const isFormOpen = ref(false)
const editingId = ref<number | null>(null)
const nombre = ref('')
const formError = ref('')
const isSaving = ref(false)

const liberandoId = ref<number | null>(null)
const liberarErrorFor = ref<Record<number, string>>({})

const abriendoId = ref<number | null>(null)
const pedidoErrorFor = ref<Record<number, string>>({})

const pedidoAbierto = ref<Venta | null>(null)
const pedidoMesaNombre = ref('')
const ocupadaSinPedidoFor = ref<Record<number, boolean>>({})

const mesasConPedidoAbiertoIds = ref<Set<number>>(new Set())

const deletingId = ref<number | null>(null)
const deleteErrorFor = ref<Record<number, string>>({})
const pendingDelete = ref<Mesa | null>(null)
const deleteModalError = ref('')

async function refreshMesasConPedidoAbierto() {
  try {
    const abiertas = await listVentas({ estado: 'abierta' })
    mesasConPedidoAbiertoIds.value = new Set(
      abiertas.filter((venta) => venta.mesa_id !== null).map((venta) => venta.mesa_id as number),
    )
  } catch {
    mesasConPedidoAbiertoIds.value = new Set()
  }
}

onMounted(() => {
  load()
  refreshMesasConPedidoAbierto()
})

function openCreateForm() {
  editingId.value = null
  nombre.value = ''
  formError.value = ''
  isFormOpen.value = true
}

function openEditForm(mesa: Mesa) {
  editingId.value = mesa.id
  nombre.value = mesa.nombre_o_numero
  formError.value = ''
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  editingId.value = null
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
    if (editingId.value === null) {
      await create({ nombre_o_numero: nombre.value.trim() })
      pushToast('Mesa creada')
    } else {
      await update(editingId.value, { nombre_o_numero: nombre.value.trim() })
      pushToast('Mesa actualizada')
    }
    closeForm()
  } catch (err) {
    formError.value = messageFor(
      err,
      editingId.value === null ? 'No fue posible crear la mesa.' : 'No fue posible actualizar la mesa.',
    )
  } finally {
    isSaving.value = false
  }
}

function requestDelete(mesa: Mesa) {
  pendingDelete.value = mesa
  deleteModalError.value = ''
}

function cancelDelete() {
  pendingDelete.value = null
  deleteModalError.value = ''
}

async function confirmDelete() {
  const mesa = pendingDelete.value
  if (!mesa) return

  delete deleteErrorFor.value[mesa.id]
  deleteModalError.value = ''
  deletingId.value = mesa.id
  try {
    await remove(mesa.id)
    pendingDelete.value = null
    pushToast('Mesa eliminada')
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      deleteErrorFor.value[mesa.id] =
        'No se puede eliminar esta mesa porque tiene ventas registradas en su historial.'
      pendingDelete.value = null
    } else {
      deleteModalError.value = messageFor(err, 'No fue posible eliminar la mesa.')
    }
  } finally {
    deletingId.value = null
  }
}

async function onLiberar(mesa: Mesa) {
  delete liberarErrorFor.value[mesa.id]
  liberandoId.value = mesa.id
  try {
    await liberar(mesa.id)
    pushToast('Mesa liberada')
  } catch (err) {
    liberarErrorFor.value[mesa.id] = messageFor(err, 'No fue posible liberar la mesa.')
  } finally {
    liberandoId.value = null
  }
}

async function onAbrirMesa(mesa: Mesa) {
  delete pedidoErrorFor.value[mesa.id]
  delete ocupadaSinPedidoFor.value[mesa.id]

  if (mesa.estado === 'libre') {
    abriendoId.value = mesa.id
    try {
      const nuevaVenta = await abrirPedido({ mesa_id: mesa.id })
      pedidoAbierto.value = nuevaVenta
      pedidoMesaNombre.value = mesa.nombre_o_numero
      await Promise.all([load(), refreshMesasConPedidoAbierto()])
    } catch (err) {
      pedidoErrorFor.value[mesa.id] = messageFor(err, 'No fue posible abrir el pedido.')
    } finally {
      abriendoId.value = null
    }
    return
  }

  abriendoId.value = mesa.id
  try {
    const ventasAbiertas = await listVentas({ mesa_id: mesa.id, estado: 'abierta' })
    if (ventasAbiertas.length > 0) {
      pedidoAbierto.value = ventasAbiertas[0]
      pedidoMesaNombre.value = mesa.nombre_o_numero
    } else {
      ocupadaSinPedidoFor.value[mesa.id] = true
    }
  } catch (err) {
    pedidoErrorFor.value[mesa.id] = messageFor(err, 'No fue posible buscar el pedido abierto.')
  } finally {
    abriendoId.value = null
  }
}

function onPedidoSettled() {
  pedidoAbierto.value = null
  pedidoMesaNombre.value = ''
  ocupadaSinPedidoFor.value = {}
  load()
  refreshMesasConPedidoAbierto()
}

function tituloMarcarLibre(mesa: Mesa): string | undefined {
  if (!mesasConPedidoAbiertoIds.value.has(mesa.id)) return undefined
  return "Usa 'Ver pedido' para cobrar o descartar el pedido en curso"
}

function onCerrarPanel() {
  pedidoAbierto.value = null
  pedidoMesaNombre.value = ''
}
</script>

<template>
  <section class="view">
    <header class="view-header">
      <h1>Mesas</h1>
      <button type="button" class="btn-primary" @click="openCreateForm">+ Nueva mesa</button>
    </header>

    <BaseModal v-if="isFormOpen" @close="closeForm">
      <form class="mesa-form" @submit.prevent="onSubmit">
        <h2>{{ editingId === null ? 'Nueva mesa' : 'Editar mesa' }}</h2>

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
            {{ isSaving ? 'Guardando…' : editingId === null ? 'Crear' : 'Guardar' }}
          </button>
        </div>
      </form>
    </BaseModal>

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
          <button
            type="button"
            class="btn-secondary"
            :disabled="abriendoId === mesa.id"
            @click="onAbrirMesa(mesa)"
          >
            {{ abriendoId === mesa.id ? 'Abriendo…' : mesa.estado === 'libre' ? 'Abrir mesa' : 'Ver pedido' }}
          </button>
          <button
            type="button"
            class="btn-link"
            :disabled="mesa.estado === 'libre' || liberandoId === mesa.id || mesasConPedidoAbiertoIds.has(mesa.id)"
            :title="tituloMarcarLibre(mesa)"
            @click="onLiberar(mesa)"
          >
            {{ liberandoId === mesa.id ? 'Liberando…' : 'Marcar libre' }}
          </button>
        </div>

        <div class="mesa-icon-actions">
          <button
            type="button"
            class="btn-link"
            aria-label="Editar mesa"
            title="Editar mesa"
            @click="openEditForm(mesa)"
          >
            <IconPencil />
          </button>
          <button
            type="button"
            class="btn-link btn-link--danger"
            :disabled="deletingId === mesa.id"
            :aria-label="deletingId === mesa.id ? 'Eliminando mesa…' : 'Eliminar mesa'"
            :title="deletingId === mesa.id ? 'Eliminando mesa…' : 'Eliminar mesa'"
            :aria-busy="deletingId === mesa.id"
            @click="requestDelete(mesa)"
          >
            <IconTrash />
          </button>
        </div>

        <p v-if="liberarErrorFor[mesa.id]" class="error error--inline" role="alert">
          {{ liberarErrorFor[mesa.id] }}
        </p>
        <p v-if="pedidoErrorFor[mesa.id]" class="error error--inline" role="alert">
          {{ pedidoErrorFor[mesa.id] }}
        </p>
        <p v-if="deleteErrorFor[mesa.id]" class="error error--inline" role="alert">
          {{ deleteErrorFor[mesa.id] }}
        </p>
        <p v-if="ocupadaSinPedidoFor[mesa.id]" class="status status--inline">
          Esta mesa está ocupada por una venta directa (sin pedido progresivo).
        </p>
        <p v-if="mesasConPedidoAbiertoIds.has(mesa.id)" class="status status--inline">
          Tiene un pedido en curso: usa "Ver pedido" para cobrar o descartar antes de marcar libre.
        </p>
      </li>
    </ul>

    <PedidoEnCursoModal
      v-if="pedidoAbierto"
      :venta="pedidoAbierto"
      :mesa-nombre="pedidoMesaNombre"
      @settled="onPedidoSettled"
      @close="onCerrarPanel"
    />

    <ConfirmModal
      v-if="pendingDelete"
      title="Eliminar mesa"
      :message="`¿Eliminar la mesa «${pendingDelete.nombre_o_numero}»? Esta acción no se puede deshacer.`"
      :is-confirming="deletingId === pendingDelete.id"
      :error-message="deleteModalError"
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
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(123, 44, 191, 0.18);
  border-color: var(--color-purple);
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--color-purple);
  outline-offset: 2px;
}

.btn-link {
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

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.mesa-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.status--inline {
  margin-top: 8px;
  font-size: 12.5px;
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

.mesa-icon-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: -4px;
}
</style>
