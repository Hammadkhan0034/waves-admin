import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Eye, DollarSign, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card } from '../../components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { InlineLoader } from '../../components/common/PageLoader'
import { EmptyState } from '../../components/common/EmptyState'
import { adminBookingsApi } from '../../api/admin'
import type { Booking, BookingEvent, Payment } from '../../types'
import { formatDateTime, formatAmount, categoryLabel, timeAgo } from '../../utils'

export default function Bookings() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [showRefund, setShowRefund] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bookings', page, statusFilter],
    queryFn: () => adminBookingsApi.list({ page, limit: 20, status: statusFilter || undefined }),
  })

  const { data: timelineData } = useQuery({
    queryKey: ['admin', 'booking-timeline', selectedBooking?.id],
    queryFn: () => adminBookingsApi.getTimeline(selectedBooking!.id),
    enabled: !!selectedBooking,
  })

  const { data: paymentData } = useQuery({
    queryKey: ['admin', 'booking-payment', selectedBooking?.id],
    queryFn: () => adminBookingsApi.getPayment(selectedBooking!.id),
    enabled: !!selectedBooking,
  })

  const refundMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      adminBookingsApi.refund(id, {
        amount: refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined,
        reason: refundReason || undefined,
      }),
    onSuccess: () => {
      toast.success('Refund issued')
      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      qc.invalidateQueries({ queryKey: ['admin', 'booking-payment'] })
      setShowRefund(false)
      setRefundAmount('')
      setRefundReason('')
    },
    onError: () => toast.error('Failed to issue refund'),
  })

  const bookings = data?.data.data ?? []
  const meta = data?.data
  const payment = paymentData?.data as Payment | undefined
  const timeline = timelineData?.data as { events?: BookingEvent[] } | undefined

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Bookings" subtitle="Manage all platform bookings" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All statuses</option>
            {['pending_payment', 'pending_operator', 'accepted', 'in_progress', 'completed', 'canceled', 'rejected', 'refunded', 'disputed'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : bookings.length === 0 ? (
            <EmptyState icon={BookOpen} title="No bookings found" />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>ID</Th>
                    <Th>Category</Th>
                    <Th>Status</Th>
                    <Th>Party</Th>
                    <Th>Start</Th>
                    <Th>Total</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {bookings.map((b) => (
                    <Tr key={b.id}>
                      <Td className="font-mono text-xs text-gray-400">{b.id.slice(0, 8)}…</Td>
                      <Td>{categoryLabel(b.category)}</Td>
                      <Td><StatusBadge status={b.status} /></Td>
                      <Td>{b.partySize ?? '—'} pax</Td>
                      <Td className="text-gray-500 text-xs">{b.startAt ? formatDateTime(b.startAt) : '—'}</Td>
                      <Td className="font-semibold">{formatAmount(b.totalAmount)}</Td>
                      <Td className="text-gray-400 text-xs">{timeAgo(b.createdAt)}</Td>
                      <Td>
                        <button
                          onClick={() => { setSelectedBooking(b); setShowRefund(false) }}
                          className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Td>
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

      {/* Booking Detail Modal */}
      <Modal
        open={!!selectedBooking}
        onClose={() => { setSelectedBooking(null); setShowRefund(false) }}
        title="Booking Detail"
        size="xl"
      >
        {selectedBooking && (
          <div className="space-y-5">
            {/* Booking info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Booking ID', selectedBooking.id.slice(0, 12) + '…'],
                ['Category', categoryLabel(selectedBooking.category)],
                ['Status', selectedBooking.status],
                ['Party Size', selectedBooking.partySize ?? '—'],
                ['Start', selectedBooking.startAt ? formatDateTime(selectedBooking.startAt) : '—'],
                ['End', selectedBooking.endAt ? formatDateTime(selectedBooking.endAt) : '—'],
                ['Duration', selectedBooking.durationMinutes ? `${selectedBooking.durationMinutes} min` : '—'],
                ['Pickup', selectedBooking.pickupLabel ?? '—'],
                ['Dropoff', selectedBooking.dropoffLabel ?? '—'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium capitalize">{String(v)}</dd>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatAmount(selectedBooking.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee</span>
                <span>{formatAmount(selectedBooking.platformFeeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatAmount(selectedBooking.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-1 mt-1">
                <span>Total</span>
                <span>{formatAmount(selectedBooking.totalAmount)}</span>
              </div>
            </div>

            {/* Payment info */}
            {payment && (
              <div className="text-sm space-y-1">
                <h4 className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Payment
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Provider', payment.provider],
                    ['Status', payment.status],
                    ['Stripe ID', payment.stripePaymentIntentId?.slice(0, 16) + '…'],
                    ['Refunds', payment.refunds?.length ?? 0],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {timeline?.events && timeline.events.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 flex items-center gap-1.5 text-sm mb-2">
                  <Clock className="w-4 h-4" /> Timeline
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {timeline.events.map((ev: BookingEvent) => (
                    <div key={ev.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium capitalize">{ev.eventType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(ev.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refund section */}
            {payment?.status === 'succeeded' && !showRefund && (
              <Button variant="outline" onClick={() => setShowRefund(true)}>
                <DollarSign className="w-4 h-4" /> Issue Refund
              </Button>
            )}
            {showRefund && (
              <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800">Issue Refund</h4>
                <div>
                  <label className="text-xs text-gray-600">Amount (USD, leave blank for full refund)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="e.g. 25.00"
                    className="w-full mt-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Reason</label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund"
                    className="w-full mt-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    loading={refundMutation.isPending}
                    onClick={() => refundMutation.mutate({ id: selectedBooking.id })}
                  >
                    Confirm Refund
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRefund(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
