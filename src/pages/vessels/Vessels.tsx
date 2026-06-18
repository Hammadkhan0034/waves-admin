import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ship, CheckCircle, XCircle, Ban, Eye, Image } from 'lucide-react'
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
import { adminVesselsApi } from '../../api/admin'
import type { Vessel } from '../../types'
import { formatDate, categoryLabel } from '../../utils'

export default function Vessels() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [imgIndex, setImgIndex] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'vessels', page, statusFilter],
    queryFn: () => adminVesselsApi.list({ page, limit: 20, status: statusFilter || undefined }),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminVesselsApi.review(id, { status, reviewNotes: reviewNotes || undefined }),
    onSuccess: () => {
      toast.success('Vessel updated')
      qc.invalidateQueries({ queryKey: ['admin', 'vessels'] })
      setSelectedVessel(null)
      setReviewNotes('')
    },
    onError: () => toast.error('Failed to update vessel'),
  })

  const vessels = data?.data.data ?? []
  const meta = data?.data

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Vessels" subtitle="Manage all vessel listings" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending_approval">Pending approval</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : vessels.length === 0 ? (
            <EmptyState icon={Ship} title="No vessels found" description="Try adjusting your filters." />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Vessel</Th>
                    <Th>Category</Th>
                    <Th>Capacity</Th>
                    <Th>Status</Th>
                    <Th>Operator</Th>
                    <Th>Submitted</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {vessels.map((v) => (
                    <Tr key={v.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          {v.media?.[0] ? (
                            <img
                              src={v.media[0].url}
                              alt=""
                              className="w-10 h-8 object-cover rounded-md shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-8 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                              <Image className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{v.title}</p>
                            <p className="text-xs text-gray-400">{v.makeModel ?? '—'}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>{categoryLabel(v.category)}</Td>
                      <Td>{v.capacity} pax</Td>
                      <Td><StatusBadge status={v.status} /></Td>
                      <Td className="text-gray-500 text-xs font-mono">{v.operatorId.slice(0, 8)}…</Td>
                      <Td className="text-gray-500">{formatDate(v.updatedAt)}</Td>
                      <Td>
                        <button
                          onClick={() => { setSelectedVessel(v); setImgIndex(0) }}
                          className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Review"
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

      {/* Vessel Review Modal */}
      <Modal
        open={!!selectedVessel}
        onClose={() => { setSelectedVessel(null); setReviewNotes('') }}
        title="Vessel Review"
        size="xl"
      >
        {selectedVessel && (
          <div className="space-y-5">
            {/* Images */}
            {(selectedVessel.media ?? []).length > 0 && (
              <div className="space-y-2">
                <img
                  src={selectedVessel.media![imgIndex].url}
                  alt=""
                  className="w-full h-48 object-cover rounded-lg"
                />
                {selectedVessel.media!.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedVessel.media!.map((m, i) => (
                      <button key={m.id} onClick={() => setImgIndex(i)}
                        className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 ${i === imgIndex ? 'border-brand-500' : 'border-transparent'}`}>
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Title', selectedVessel.title],
                ['Category', categoryLabel(selectedVessel.category)],
                ['Capacity', `${selectedVessel.capacity} passengers`],
                ['Year', selectedVessel.year ?? '—'],
                ['Make/Model', selectedVessel.makeModel ?? '—'],
                ['Status', selectedVessel.status],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium capitalize">{String(v)}</dd>
                </div>
              ))}
            </div>

            {selectedVessel.description && (
              <div className="text-sm">
                <dt className="text-gray-500 mb-1">Description</dt>
                <dd className="text-gray-700">{selectedVessel.description}</dd>
              </div>
            )}

            {selectedVessel.pickupNotes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>Pickup notes:</strong> {selectedVessel.pickupNotes}
              </div>
            )}

            {selectedVessel.reviewNotes && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>Previous notes:</strong> {selectedVessel.reviewNotes}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Review notes (optional)</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Reason for approval/rejection…"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              {selectedVessel.status !== 'active' && (
                <Button
                  variant="primary"
                  loading={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: selectedVessel.id, status: 'active' })}
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
              )}
              {selectedVessel.status !== 'inactive' && (
                <Button
                  variant="danger"
                  loading={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: selectedVessel.id, status: 'inactive' })}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              )}
              {selectedVessel.status !== 'suspended' && (
                <Button
                  variant="outline"
                  loading={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: selectedVessel.id, status: 'suspended' })}
                >
                  <Ban className="w-4 h-4" /> Suspend
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
