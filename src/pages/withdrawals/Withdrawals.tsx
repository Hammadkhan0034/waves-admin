import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Wallet, Building2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminWithdrawalsApi } from '../../api/admin'
import type { WithdrawalRequest, WithdrawalStatus } from '../../types'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

const STATUS_TABS: { label: string; value: WithdrawalStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

function statusColor(status: WithdrawalStatus): 'yellow' | 'green' | 'red' {
  if (status === 'pending') return 'yellow'
  if (status === 'approved') return 'green'
  return 'red'
}

export default function Withdrawals() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<WithdrawalStatus | 'all'>('pending')
  const [selected, setSelected] = useState<WithdrawalRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals', tab],
    queryFn: () => adminWithdrawalsApi.list(tab === 'all' ? undefined : tab),
  })

  const requests: WithdrawalRequest[] = Array.isArray(data?.data) ? data.data : []

  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminWithdrawalsApi.approve(id, note),
    onSuccess: () => {
      toast.success('Withdrawal approved')
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
      closeModal()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to approve')
    },
  })

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminWithdrawalsApi.reject(id, note),
    onSuccess: () => {
      toast.success('Withdrawal rejected')
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
      closeModal()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to reject')
    },
  })

  const openAction = (req: WithdrawalRequest, type: 'approve' | 'reject') => {
    setSelected(req)
    setAction(type)
    setAdminNote('')
  }

  const closeModal = () => {
    setSelected(null)
    setAction(null)
    setAdminNote('')
  }

  const handleSubmit = () => {
    if (!selected) return
    if (action === 'approve') approve.mutate({ id: selected.id, note: adminNote })
    else reject.mutate({ id: selected.id, note: adminNote })
  }

  const isPending = approve.isPending || reject.isPending

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process driver payout requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Wallet className="w-8 h-8" />
            <p className="text-sm">No withdrawal requests</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Account</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{req.operatorId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    {req.payoutAccount ? (
                      <div>
                        <p className="font-medium text-gray-900">{req.payoutAccount.accountHolderName}</p>
                        <p className="text-xs text-gray-500">{req.payoutAccount.bankName} · {req.payoutAccount.accountNumber}</p>
                        {req.payoutAccount.iban && (
                          <p className="text-xs text-gray-400">IBAN: {req.payoutAccount.iban}</p>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs">
                        <AlertCircle className="w-3 h-3" /> No account saved
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {Number(req.amount).toFixed(2)} {req.currency}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusColor(req.status)}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                    {req.adminNote ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openAction(req, 'approve')}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => openAction(req, 'reject')}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve / Reject Modal */}
      {selected && action && (
        <Modal
          isOpen
          onClose={closeModal}
          title={action === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
          size="md"
        >
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{Number(selected.amount).toFixed(2)} {selected.currency}</span>
              </div>
              {selected.payoutAccount && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{selected.payoutAccount.accountHolderName}</p>
                    <p className="text-xs text-gray-500">{selected.payoutAccount.bankName}</p>
                    <p className="text-xs text-gray-500">Account: {selected.payoutAccount.accountNumber}</p>
                    {selected.payoutAccount.routingNumber && (
                      <p className="text-xs text-gray-500">Routing: {selected.payoutAccount.routingNumber}</p>
                    )}
                    {selected.payoutAccount.iban && (
                      <p className="text-xs text-gray-500">IBAN: {selected.payoutAccount.iban}</p>
                    )}
                    <p className="text-xs text-gray-500">{selected.payoutAccount.country} · {selected.payoutAccount.currency}</p>
                  </div>
                </div>
              )}
            </div>

            {action === 'approve' && (
              <div className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
                This will deduct <strong>{Number(selected.amount).toFixed(2)} {selected.currency}</strong> from the driver's wallet. Transfer the funds to the bank account above manually.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Admin note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={action === 'approve' ? 'e.g. Transferred via bank on 2026-06-18' : 'e.g. Insufficient verification documents'}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={closeModal} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant={action === 'approve' ? 'primary' : 'danger'}
                onClick={handleSubmit}
                loading={isPending}
              >
                {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
