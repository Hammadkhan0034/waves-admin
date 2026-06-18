import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import { Card } from '../../components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { InlineLoader } from '../../components/common/PageLoader'
import { EmptyState } from '../../components/common/EmptyState'
import { adminBookingsApi } from '../../api/admin'
import type { Booking } from '../../types'
import { formatAmount, formatDateTime, timeAgo } from '../../utils'

export default function Payments() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('completed')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', page, statusFilter],
    queryFn: () => adminBookingsApi.list({ page, limit: 20, status: statusFilter || undefined }),
  })

  const bookings = data?.data.data ?? []
  const meta = data?.data

  const totalRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalAmount ?? 0), 0)

  const platformFees = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.platformFeeAmount ?? 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Payments" subtitle="Payment records linked to bookings" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue (this page)', value: formatAmount(totalRevenue), color: 'text-green-600' },
            { label: 'Platform Fees (this page)', value: formatAmount(platformFees), color: 'text-brand-600' },
            { label: 'Bookings Shown', value: bookings.length, color: 'text-gray-900' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All bookings</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="disputed">Disputed</option>
            <option value="pending_payment">Pending payment</option>
          </select>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : bookings.length === 0 ? (
            <EmptyState icon={CreditCard} title="No payment records found" />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Booking ID</Th>
                    <Th>Category</Th>
                    <Th>Status</Th>
                    <Th>Subtotal</Th>
                    <Th>Platform Fee</Th>
                    <Th>Tax</Th>
                    <Th>Total</Th>
                    <Th>Start Date</Th>
                    <Th>Created</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {bookings.map((b: Booking) => (
                    <Tr key={b.id}>
                      <Td className="font-mono text-xs text-gray-400">{b.id.slice(0, 10)}…</Td>
                      <Td className="capitalize">{b.category}</Td>
                      <Td><StatusBadge status={b.status} /></Td>
                      <Td>{formatAmount(b.subtotalAmount)}</Td>
                      <Td className="text-brand-600">{formatAmount(b.platformFeeAmount)}</Td>
                      <Td>{formatAmount(b.taxAmount)}</Td>
                      <Td className="font-semibold">{formatAmount(b.totalAmount)}</Td>
                      <Td className="text-xs text-gray-400">{b.startAt ? formatDateTime(b.startAt) : '—'}</Td>
                      <Td className="text-xs text-gray-400">{timeAgo(b.createdAt)}</Td>
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
    </div>
  )
}
