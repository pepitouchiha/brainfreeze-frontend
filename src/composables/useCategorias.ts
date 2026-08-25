import { ref } from 'vue'
import { createCategoria, deleteCategoria, listCategorias, updateCategoria } from '../api/categorias'
import { ApiError } from '../api/client'
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../api/types'

export function useCategorias() {
  const categorias = ref<Categoria[]>([])
  const isLoading = ref(false)
  const loadError = ref('')

  async function load(): Promise<void> {
    isLoading.value = true
    loadError.value = ''
    try {
      categorias.value = await listCategorias()
    } catch {
      loadError.value = 'No fue posible cargar las categorías. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: CategoriaCreate): Promise<void> {
    const nueva = await createCategoria(payload)
    categorias.value = [...categorias.value, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }

  async function update(id: number, payload: CategoriaUpdate): Promise<void> {
    const actualizada = await updateCategoria(id, payload)
    categorias.value = categorias.value
      .map((c) => (c.id === id ? actualizada : c))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }

  async function remove(id: number): Promise<void> {
    await deleteCategoria(id)
    categorias.value = categorias.value.filter((c) => c.id !== id)
  }

  function messageFor(err: unknown, fallback: string): string {
    if (err instanceof ApiError && typeof err.message === 'string' && err.message) {
      return err.message
    }
    return fallback
  }

  return { categorias, isLoading, loadError, load, create, update, remove, messageFor }
}
