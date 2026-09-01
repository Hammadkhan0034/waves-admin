import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HelpCircle, Eye } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import { Card } from '../../components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { SearchInput } from '../../components/common/SearchInput'
import { InlineLoader } from '../../components/common/PageLoader'
import { EmptyState } from '../../components/common/EmptyState'
import { adminHelpCenterApi, type HelpCenterSubmission } from '../../api/admin'
import { formatDate, formatDateTime } from '../../utils'

function userLabel(submission: HelpCenterSubmission) {
  const user = submission.user
  if (!user) return 'Unknown user'
  return user.profile?.name ?? user.phone ?? user.email ?? user.id
}

export default function HelpCenter() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<HelpCenterSubmission | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'help-center', 'submissions', page, search],
    queryFn: () =>
      adminHelpCenterApi.list({
        page,
        limit: 20,
        search: search || undefined,
      }),
  })

  const submissions = data?.data.data ?? []
  const meta = data?.data

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Help Center"
        subtitle="Support requests submitted by users from the mobile app"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search by subject, message, user…"
            className="w-72"
          />
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No support requests yet"
              description="When users submit the help center form in the app, their queries will appear here."
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>User</Th>
                    <Th>Submitted</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {submissions.map((submission) => (
                    <Tr key={submission.id}>
                      <Td>
                        <p className="font-medium text-gray-900 line-clamp-1">{submission.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{submission.message}</p>
                      </Td>
                      <Td>
                        <p className="text-sm text-gray-900">{userLabel(submission)}</p>
                        <p className="text-xs text-gray-500">
                          {submission.user?.phone ?? submission.user?.email ?? '—'}
                        </p>
                      </Td>
                      <Td className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(submission.createdAt)}
                      </Td>
                      <Td className="text-right">
                        <Button size="sm" variant="secondary" onClick={() => setSelected(submission)}>
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {meta && meta.totalPages > 1 && (
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </Card>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Support Request">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</p>
              <p className="text-sm text-gray-900 mt-1">{selected.subject}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</p>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">User</p>
                <p className="text-sm text-gray-900 mt-1">{userLabel(selected)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.user?.phone ?? selected.user?.email ?? selected.userId}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</p>
                <p className="text-sm text-gray-900 mt-1">{formatDateTime(selected.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
