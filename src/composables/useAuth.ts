import { ref } from 'vue'

const TOKEN_STORAGE_KEY = 'bf_token'
const USER_EMAIL_STORAGE_KEY = 'bf_user_email'

const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))
const userEmail = ref<string | null>(localStorage.getItem(USER_EMAIL_STORAGE_KEY))

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

export function getUserEmail(): string | null {
  return userEmail.value
}

export function setUserEmail(email: string): void {
  userEmail.value = email
  localStorage.setItem(USER_EMAIL_STORAGE_KEY, email)
}

export function clearUserEmail(): void {
  userEmail.value = null
  localStorage.removeItem(USER_EMAIL_STORAGE_KEY)
}

export function useAuth() {
  return {
    token,
    userEmail,
    isAuthenticated: () => token.value !== null,
    setToken,
    clearToken,
    getUserEmail,
    setUserEmail,
    clearUserEmail,
  }
}
