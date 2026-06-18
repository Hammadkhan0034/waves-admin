import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return '—'
  }
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function formatCurrency(amount?: number, currency = 'USD'): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

export function formatAmount(amount?: number): string {
  if (amount == null) return '—'
  return `$${(amount / 100).toFixed(2)}`
}

export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    succeeded: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    accepted: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    pending_operator: 'bg-yellow-100 text-yellow-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    price_quoted: 'bg-yellow-100 text-yellow-800',
    payment_pending: 'bg-yellow-100 text-yellow-800',
    operator_accepted: 'bg-blue-100 text-blue-800',
    searching: 'bg-purple-100 text-purple-800',
    suspended: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    canceled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
    partially_refunded: 'bg-orange-100 text-orange-800',
    disputed: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-600',
    inactive: 'bg-gray-100 text-gray-600',
    deleted: 'bg-gray-200 text-gray-500',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    taxi: 'Taxi',
    jetski: 'Jet Ski',
    partyboat: 'Party Boat',
    leisure: 'Leisure',
  }
  return map[cat] ?? cat
}
