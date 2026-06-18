import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users as UsersIcon, Eye, Ban, CheckCircle, FileText } from 'lucide-react'
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
import { adminUsersApi } from '../../api/admin'
import type { AuthUser } from '../../types'
import { formatDate, timeAgo, getInitials } from '../../utils'

export default function Users() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [docsUser, setDocsUser] = useState<AuthUser | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, statusFilter],
    queryFn: () => adminUsersApi.list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }),
  })

  const { data: docsData, isLoading: loadingDocs } = useQuery({
    queryKey: ['admin', 'user-documents', docsUser?.id],
    queryFn: () => adminUsersApi.listDocuments({ limit: 50 }),
    enabled: !!docsUser,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      adminUsersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('User status updated')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
    },
    onError: () => toast.error('Failed to update status'),
  })

  const reviewDocMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminUsersApi.reviewDocument(id, { status, reviewNotes: notes }),
    onSuccess: () => {
      toast.success('Document reviewed')
      qc.invalidateQueries({ queryKey: ['admin', 'user-documents'] })
    },
    onError: () => toast.error('Failed to review document'),
  })

  const users = data?.data.data ?? []
  const meta = data?.data

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Users" subtitle="Manage all platform users" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search by phone or email…"
            className="w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_verification">Pending verification</option>
          </select>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : users.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your filters." />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>User</Th>
                    <Th>Phone / Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Provider</Th>
                    <Th>Joined</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(user.profile?.name ?? user.phone ?? '?')}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">
                            {user.profile?.name ?? '—'}
                          </span>
                        </div>
                      </Td>
                      <Td className="font-mono text-xs">{user.phone ?? user.email ?? '—'}</Td>
                      <Td><StatusBadge status={user.role} /></Td>
                      <Td><StatusBadge status={user.status} /></Td>
                      <Td className="capitalize">{user.authProvider}</Td>
                      <Td className="text-gray-500">{timeAgo(user.createdAt)}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <button
                            title="View detail"
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="View documents"
                            onClick={() => setDocsUser(user)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              title="Suspend"
                              onClick={() => statusMutation.mutate({ id: user.id, status: 'suspended' })}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              title="Activate"
                              onClick={() => statusMutation.mutate({ id: user.id, status: 'active' })}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {meta && meta.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={20}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {/* User Detail Modal */}
      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Detail"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
                {getInitials(selectedUser.profile?.name ?? '?')}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.profile?.name ?? '—'}</p>
                <p className="text-sm text-gray-500">{selectedUser.phone ?? selectedUser.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Role', selectedUser.role],
                ['Status', selectedUser.status],
                ['Provider', selectedUser.authProvider],
                ['Joined', formatDate(selectedUser.createdAt)],
                ['Last Login', formatDate(selectedUser.lastLoginAt)],
                ['ID', selectedUser.id.slice(0, 8) + '…'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900 capitalize">{v ?? '—'}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2 pt-2">
              {selectedUser.status === 'active' ? (
                <Button
                  variant="danger"
                  size="sm"
                  loading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: selectedUser.id, status: 'suspended' })}
                >
                  Suspend User
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  loading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: selectedUser.id, status: 'active' })}
                >
                  Activate User
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Documents Modal */}
      <Modal
        open={!!docsUser}
        onClose={() => setDocsUser(null)}
        title={`Documents — ${docsUser?.profile?.name ?? docsUser?.phone}`}
        size="lg"
      >
        {loadingDocs ? (
          <InlineLoader />
        ) : (
          <div className="space-y-3">
            {(docsData?.data.data ?? [])
              .filter((d) => d.authId === docsUser?.id)
              .map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium capitalize">{doc.docType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">Uploaded {formatDate(doc.createdAt)}</p>
                    {doc.reviewNotes && <p className="text-xs text-gray-400 mt-0.5">{doc.reviewNotes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline">View</a>
                    {doc.status === 'pending' && (
                      <>
                        <Button size="sm" variant="primary"
                          onClick={() => reviewDocMutation.mutate({ id: doc.id, status: 'approved' })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger"
                          onClick={() => reviewDocMutation.mutate({ id: doc.id, status: 'rejected' })}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            {(docsData?.data.data ?? []).filter((d) => d.authId === docsUser?.id).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
