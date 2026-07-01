import { apiClient } from './client'
import type {
  AuthUser, Operator, Vessel, Booking, Payment,
  PaginatedResponse, UserDocument,
} from '../types'
import type { WithdrawalRequest, WithdrawalStatus } from '../types'

// ─── Query Helpers ────────────────────────────────────────────────────────────

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const adminUsersApi = {
  list: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) =>
    apiClient.get<PaginatedResponse<AuthUser>>(`/admin/users${qs(params)}`),

  getById: (userId: string) =>
    apiClient.get<AuthUser>(`/admin/users/${userId}`),

  updateStatus: (userId: string, status: 'active' | 'suspended') =>
    apiClient.patch(`/admin/users/${userId}/status`, { status }),

  listDocuments: (params: { page?: number; limit?: number; status?: string } = {}) =>
    apiClient.get<PaginatedResponse<UserDocument>>(`/admin/users/documents${qs(params)}`),

  getDocument: (id: string) =>
    apiClient.get<UserDocument>(`/admin/users/documents/${id}`),

  reviewDocument: (id: string, body: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/admin/users/documents/${id}/review`, body),
}

// ─── Operators ────────────────────────────────────────────────────────────────

export const adminOperatorsApi = {
  list: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) =>
    apiClient.get<PaginatedResponse<Operator>>(`/admin/operators${qs(params)}`),

  getById: (operatorId: string) =>
    apiClient.get<Operator>(`/admin/operators/${operatorId}`),

  review: (operatorId: string, body: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/admin/operators/${operatorId}/review`, body),

  reviewDocument: (documentId: string, body: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/admin/operators/documents/${documentId}/review`, body),
}

// ─── Vessels ──────────────────────────────────────────────────────────────────

export const adminVesselsApi = {
  list: (params: { page?: number; limit?: number; status?: string } = {}) =>
    apiClient.get<PaginatedResponse<Vessel>>(`/admin/vessels${qs(params)}`),

  listPending: (params: { page?: number; limit?: number } = {}) =>
    apiClient.get<PaginatedResponse<Vessel>>(`/admin/vessels/pending${qs(params)}`),

  review: (vesselId: string, body: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/admin/vessels/${vesselId}/review`, body),
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export const adminWithdrawalsApi = {
  list: (status?: WithdrawalStatus) =>
    apiClient.get<WithdrawalRequest[]>(`/admin/withdrawals${status ? `?status=${status}` : ''}`),

  approve: (requestId: string, adminNote?: string) =>
    apiClient.post(`/admin/withdrawals/${requestId}/approve`, { adminNote }),

  reject: (requestId: string, adminNote?: string) =>
    apiClient.post(`/admin/withdrawals/${requestId}/reject`, { adminNote }),
}

export const adminBookingsApi = {
  list: (params: { page?: number; limit?: number; status?: string; userId?: string; operatorId?: string } = {}) =>
    apiClient.get<PaginatedResponse<Booking>>(`/admin/bookings${qs(params)}`),

  getTimeline: (bookingId: string) =>
    apiClient.get(`/admin/bookings/${bookingId}/timeline`),

  getPayment: (bookingId: string) =>
    apiClient.get<Payment>(`/admin/bookings/${bookingId}/payment`),

  refund: (bookingId: string, body: { amount?: number; reason?: string }) =>
    apiClient.post(`/admin/bookings/${bookingId}/refund`, body),
}

// ─── System Settings ──────────────────────────────────────────────────────────

export interface SystemSetting {
  key: string
  value: string
  description: string | null
  updatedAt: string
}

export const adminSettingsApi = {
  list: () =>
    apiClient.get<SystemSetting[]>('/admin/settings'),

  update: (key: string, value: string) =>
    apiClient.put<SystemSetting>(`/admin/settings/${key}`, { value }),
}
