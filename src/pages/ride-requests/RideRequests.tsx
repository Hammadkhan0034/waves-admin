import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigation, Star } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import { Card } from '../../components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { InlineLoader } from '../../components/common/PageLoader'
import { EmptyState } from '../../components/common/EmptyState'
import { apiClient } from '../../api/client'
import type { RideRequest, PaginatedResponse } from '../../types'
import { formatAmount, formatDateTime, categoryLabel, timeAgo } from '../../utils'

function qs(params: Record<string, unknown>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export default function RideRequests() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<RideRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ride-requests', page, statusFilter],
    queryFn: () =>
      apiClient.get<PaginatedResponse<RideRequest>>(
        `/admin/ride-requests${qs({ page, limit: 20, status: statusFilter || undefined })}`
      ),
  })

  const rides = data?.data.data ?? []
  const meta = data?.data

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Ride Requests" subtitle="Monitor on-demand ride requests" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All statuses</option>
            {['searching', 'operator_accepted', 'price_quoted', 'payment_pending', 'in_progress', 'completed', 'canceled', 'expired'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : rides.length === 0 ? (
            <EmptyState icon={Navigation} title="No ride requests found" description="Ride requests will appear here." />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>ID</Th>
                    <Th>Category</Th>
                    <Th>Status</Th>
                    <Th>Pickup</Th>
                    <Th>Dropoff</Th>
                    <Th>Party</Th>
                    <Th>Distance</Th>
                    <Th>Total</Th>
                    <Th>Rating</Th>
                    <Th>Created</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {rides.map((r) => (
                    <Tr key={r.id} onClick={() => setSelected(r)}>
                      <Td className="font-mono text-xs text-gray-400">{r.id.slice(0, 8)}…</Td>
                      <Td>{categoryLabel(r.category)}</Td>
                      <Td><StatusBadge status={r.status} /></Td>
                      <Td className="text-xs max-w-[120px] truncate">{r.pickupLabel ?? '—'}</Td>
                      <Td className="text-xs max-w-[120px] truncate">{r.dropoffLabel ?? '—'}</Td>
                      <Td>{r.partySize ?? '—'} pax</Td>
                      <Td>{r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : '—'}</Td>
                      <Td className="font-semibold">{formatAmount(r.totalAmount)}</Td>
                      <Td>
                        {r.review ? (
                          <span className="flex items-center gap-1 text-yellow-500 text-xs">
                            <Star className="w-3 h-3 fill-current" />
                            {r.review.rating}
                          </span>
                        ) : '—'}
                      </Td>
                      <Td className="text-gray-400 text-xs">{timeAgo(r.createdAt)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {meta && meta.totalPages > 1 && (
                <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPage={setPage} />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Ride Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Ride Request Detail" size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['ID', selected.id.slice(0, 12) + '…'],
                ['Category', categoryLabel(selected.category)],
                ['Status', selected.status],
                ['Party', `${selected.partySize ?? '—'} passengers`],
                ['Distance', selected.distanceKm ? `${selected.distanceKm.toFixed(2)} km` : '—'],
                ['Pickup', selected.pickupLabel ?? '—'],
                ['Dropoff', selected.dropoffLabel ?? '—'],
                ['Created', formatDateTime(selected.createdAt)],
                ['Expires', selected.expiresAt ? formatDateTime(selected.expiresAt) : '—'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium capitalize">{String(v)}</dd>
                </div>
              ))}
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Price/km</span>
                <span>{formatAmount(selected.pricePerKm)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price/person</span>
                <span>{formatAmount(selected.pricePerPerson)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatAmount(selected.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee</span>
                <span>{formatAmount(selected.platformFeeAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-1 mt-1">
                <span>Total</span>
                <span>{formatAmount(selected.totalAmount)}</span>
              </div>
            </div>

            {selected.review && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: selected.review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-1 text-sm font-medium">{selected.review.rating}/5</span>
                </div>
                {selected.review.comment && <p className="text-sm text-gray-700">{selected.review.comment}</p>}
              </div>
            )}

            {selected.specialRequests && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">Special Requests</p>
                <p className="text-sm">{selected.specialRequests}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
