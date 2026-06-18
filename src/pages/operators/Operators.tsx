import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Eye, CheckCircle, XCircle, Ban, FileText, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card } from '../../components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { SearchInput } from '../../components/common/SearchInput'
import { InlineLoader } from '../../components/common/PageLoader'
import { EmptyState } from '../../components/common/EmptyState'
import { adminOperatorsApi } from '../../api/admin'
import type { Operator, OperatorDocument } from '../../types'
import { formatDate, timeAgo, statusColor } from '../../utils'
import { cn } from '../../utils'

// Per-document review state
interface DocReview {
  notes: string
}

export default function Operators() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null)
  const [operatorReviewNotes, setOperatorReviewNotes] = useState('')
  // Per-document review notes keyed by doc ID
  const [docReviews, setDocReviews] = useState<Record<string, DocReview>>({})
  // Track which specific {docId + action} is currently in-flight
  const [pendingDoc, setPendingDoc] = useState<{ docId: string; status: string } | null>(null)
  // Track if all-docs-approved banner should show
  const [allApprovedOp, setAllApprovedOp] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'operators', page, search, statusFilter],
    queryFn: () => adminOperatorsApi.list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }),
  })

  const { data: opDetail, isPending: detailPending, isFetching: detailFetching, isError: detailError } = useQuery({
    queryKey: ['admin', 'operator-detail', selectedOp?.id],
    queryFn: () => adminOperatorsApi.getById(selectedOp!.id),
    enabled: !!selectedOp,
  })
  // Show loader while actively fetching (isPending alone fires even when disabled)
  const loadingDetail = detailFetching && detailPending

  const reviewOperatorMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminOperatorsApi.review(id, { status, reviewNotes: operatorReviewNotes || undefined }),
    onSuccess: () => {
      toast.success('Operator status updated')
      qc.invalidateQueries({ queryKey: ['admin', 'operators'] })
      qc.invalidateQueries({ queryKey: ['admin', 'operator-detail'] })
      setSelectedOp(null)
      setOperatorReviewNotes('')
    },
    onError: () => toast.error('Failed to update operator'),
  })

  const reviewDocMutation = useMutation({
    mutationFn: ({ docId, status, notes }: { docId: string; status: string; notes?: string }) => {
      setPendingDoc({ docId, status })
      return adminOperatorsApi.reviewDocument(docId, { status, reviewNotes: notes })
    },
    onSuccess: (response) => {
      setPendingDoc(null)
      const result = response.data as { document: OperatorDocument; operator: Operator; allDocsApproved: boolean }
      if (result.allDocsApproved) {
        setAllApprovedOp(result.operator.id)
        toast.success('All documents approved — operator automatically approved!', { duration: 5000 })
      } else {
        toast.success('Document reviewed')
      }
      qc.invalidateQueries({ queryKey: ['admin', 'operators'] })
      qc.invalidateQueries({ queryKey: ['admin', 'operator-detail', selectedOp?.id] })
    },
    onError: () => {
      setPendingDoc(null)
      toast.error('Failed to review document')
    },
  })

  const setDocNote = (docId: string, notes: string) =>
    setDocReviews((prev) => ({ ...prev, [docId]: { notes } }))

  const operators = data?.data.data ?? []
  const meta = data?.data
  const detail = opDetail?.data as Operator | undefined

  const documents = (detail?.documents ?? selectedOp?.documents ?? []) as OperatorDocument[]

  const allApproved = documents.length > 0 && documents.every((d) => d.status === 'approved')
  const anyRejected = documents.some((d) => d.status === 'rejected')
  const pendingCount = documents.filter((d) => d.status === 'pending').length

  function openModal(op: Operator) {
    setSelectedOp(op)
    setOperatorReviewNotes('')
    setDocReviews({})
    setAllApprovedOp(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Operators" subtitle="Manage boat operators and review their compliance documents" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search by name, email or phone…"
            className="w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : operators.length === 0 ? (
            <EmptyState icon={UserCheck} title="No operators found" description="Try adjusting your filters." />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Business</Th>
                    <Th>Contact</Th>
                    <Th>Status</Th>
                    <Th>Docs</Th>
                    <Th>Registered</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {operators.map((op) => {
                    const docs = (op.documents ?? []) as OperatorDocument[]
                    const pendingDocs = docs.filter((d) => d.status === 'pending').length
                    const approvedDocs = docs.filter((d) => d.status === 'approved').length
                    return (
                      <Tr key={op.id}>
                        <Td>
                          <div>
                            <p className="font-medium text-gray-900">{op.businessName ?? '—'}</p>
                            <p className="text-xs text-gray-400 font-mono">{op.id.slice(0, 8)}…</p>
                          </div>
                        </Td>
                        <Td>
                          <div>
                            <p className="text-sm">{op.contactName ?? '—'}</p>
                            <p className="text-xs text-gray-400">{op.contactEmail ?? op.contactPhone ?? '—'}</p>
                          </div>
                        </Td>
                        <Td><StatusBadge status={op.status} /></Td>
                        <Td>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-green-600 font-medium">{approvedDocs} ✓</span>
                            {pendingDocs > 0 && <span className="text-yellow-600">{pendingDocs} pending</span>}
                            {docs.length === 0 && <span className="text-gray-400">—</span>}
                          </div>
                        </Td>
                        <Td className="text-gray-500 text-xs">{timeAgo(op.createdAt)}</Td>
                        <Td>
                          <button
                            onClick={() => openModal(op)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Review operator"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
              {meta && meta.totalPages > 1 && (
                <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPage={setPage} />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Operator Detail Modal */}
      <Modal
        open={!!selectedOp}
        onClose={() => { setSelectedOp(null); setOperatorReviewNotes('') }}
        title={`Operator — ${selectedOp?.businessName ?? selectedOp?.id?.slice(0, 8)}`}
        size="xl"
      >
        {loadingDetail ? (
          <InlineLoader />
        ) : detailError ? (
          <div className="py-8 text-center text-sm text-red-500">
            Failed to load operator details. Please close and try again.
          </div>
        ) : selectedOp && (
          <div className="space-y-6">

            {/* Auto-approved banner */}
            {(allApproved || allApprovedOp === selectedOp.id) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">All documents approved</p>
                  <p className="text-xs text-green-700">Operator status has been automatically set to Approved.</p>
                </div>
              </div>
            )}

            {/* Pending docs warning */}
            {!allApproved && pendingCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>{pendingCount}</strong> document{pendingCount > 1 ? 's' : ''} still pending review.
                  Operator cannot be auto-approved until all documents pass.
                </p>
              </div>
            )}

            {/* Rejected docs warning */}
            {anyRejected && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-800">
                  One or more documents were rejected. Operator status will revert to Pending.
                </p>
              </div>
            )}

            {/* Operator info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Operator Profile</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Business', detail?.businessName ?? selectedOp.businessName ?? '—'],
                  ['Contact', detail?.contactName ?? selectedOp.contactName ?? '—'],
                  ['Phone', detail?.contactPhone ?? selectedOp.contactPhone ?? '—'],
                  ['Email', detail?.contactEmail ?? selectedOp.contactEmail ?? '—'],
                  ['Status', <StatusBadge key="s" status={detail?.status ?? selectedOp.status} />],
                  ['Onboarding Step', `Step ${detail?.onboardingStep ?? selectedOp.onboardingStep}`],
                  ['Joined', formatDate(selectedOp.createdAt)],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-gray-500 text-xs">{k}</dt>
                    <dd className="font-medium mt-0.5">{v}</dd>
                  </div>
                ))}
              </div>
              {(detail?.reviewNotes ?? selectedOp.reviewNotes) && (
                <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                  <span className="font-medium">Previous review notes:</span> {detail?.reviewNotes ?? selectedOp.reviewNotes}
                </div>
              )}
            </div>

            {/* ── Documents ── */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Compliance Documents ({documents.length})
              </h3>

              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const noteVal = docReviews[doc.id]?.notes ?? ''
                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          'border rounded-xl p-4 space-y-3',
                          doc.status === 'approved' && 'border-green-200 bg-green-50/40',
                          doc.status === 'rejected' && 'border-red-200 bg-red-50/40',
                          doc.status === 'pending' && 'border-yellow-200 bg-yellow-50/30',
                          doc.status === 'expired' && 'border-gray-200 bg-gray-50',
                        )}
                      >
                        {/* Doc header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold capitalize text-gray-900">
                              {doc.docType.replace(/_/g, ' ')}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                                statusColor(doc.status)
                              )}>
                                {doc.status}
                              </span>
                              {doc.expiresOn && (
                                <span className="text-xs text-gray-400">Expires {doc.expiresOn}</span>
                              )}
                            </div>
                            {doc.reviewNotes && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{doc.reviewNotes}"</p>
                            )}
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-xs text-brand-600 hover:underline font-medium"
                          >
                            View file →
                          </a>
                        </div>

                        {/* Review notes input + action buttons */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={noteVal}
                            onChange={(e) => setDocNote(doc.id, e.target.value)}
                            placeholder="Add review note (optional)…"
                            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={doc.status === 'approved' ? 'secondary' : 'primary'}
                              loading={pendingDoc?.docId === doc.id && pendingDoc.status === 'approved'}
                              disabled={pendingDoc?.docId === doc.id}
                              onClick={() =>
                                reviewDocMutation.mutate({
                                  docId: doc.id,
                                  status: 'approved',
                                  notes: noteVal || undefined,
                                })
                              }
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {doc.status === 'approved' ? 'Approved' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant={doc.status === 'rejected' ? 'secondary' : 'danger'}
                              loading={pendingDoc?.docId === doc.id && pendingDoc.status === 'rejected'}
                              disabled={pendingDoc?.docId === doc.id}
                              onClick={() =>
                                reviewDocMutation.mutate({
                                  docId: doc.id,
                                  status: 'rejected',
                                  notes: noteVal || undefined,
                                })
                              }
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {doc.status === 'rejected' ? 'Rejected' : 'Reject'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={pendingDoc?.docId === doc.id && pendingDoc.status === 'expired'}
                              disabled={pendingDoc?.docId === doc.id}
                              onClick={() =>
                                reviewDocMutation.mutate({
                                  docId: doc.id,
                                  status: 'expired',
                                  notes: noteVal || undefined,
                                })
                              }
                            >
                              Mark Expired
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Manual operator status override ── */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Manual Operator Status Override
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={operatorReviewNotes}
                  onChange={(e) => setOperatorReviewNotes(e.target.value)}
                  placeholder="Review notes for operator status change (optional)…"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedOp.status !== 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={reviewOperatorMutation.isPending}
                      onClick={() => reviewOperatorMutation.mutate({ id: selectedOp.id, status: 'approved' })}
                    >
                      <CheckCircle className="w-4 h-4" /> Force Approve
                    </Button>
                  )}
                  {selectedOp.status !== 'rejected' && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={reviewOperatorMutation.isPending}
                      onClick={() => reviewOperatorMutation.mutate({ id: selectedOp.id, status: 'rejected' })}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  )}
                  {selectedOp.status !== 'suspended' && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={reviewOperatorMutation.isPending}
                      onClick={() => reviewOperatorMutation.mutate({ id: selectedOp.id, status: 'suspended' })}
                    >
                      <Ban className="w-4 h-4" /> Suspend
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Note: Operator is automatically approved when all documents are individually approved.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
