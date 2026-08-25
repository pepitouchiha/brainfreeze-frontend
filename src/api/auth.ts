import { apiClient } from './client'
import type { LoginRequest, LoginResponse } from './types'

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', payload, { auth: false })
}
