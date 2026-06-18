import { apiClient } from './client'
import type { AuthTokens, AuthUser } from '../types'

export const authApi = {
  adminLogin: (email: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/admin/login', { email, password }),

  requestOtp: (phone: string) =>
    apiClient.post('/auth/otp/request', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<AuthTokens>('/auth/otp/verify', { phone, otp }),

  me: () =>
    apiClient.get<AuthUser>('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),
}
