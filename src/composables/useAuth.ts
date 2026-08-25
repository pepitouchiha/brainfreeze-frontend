import { ref } from 'vue'

const TOKEN_STORAGE_KEY = 'bf_token'

const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))

export function getToken(): string | null {
  return token.value
}

export function setToken(newToken: string): void {
  token.value = newToken
  localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
}

export function clearToken(): void {
  token.value = null
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function useAuth() {
  return {
    token,
    isAuthenticated: () => token.value !== null,
    setToken,
    clearToken,
  }
}
