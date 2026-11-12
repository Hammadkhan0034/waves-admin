import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Anchor, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card } from '../../components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { InlineLoader } from '../../components/common/PageLoader'
import { EmptyState } from '../../components/common/EmptyState'
import {
  adminServiceLocationsApi,
  type ServiceLocation,
  type ServiceLocationInput,
} from '../../api/admin'

const emptyForm: ServiceLocationInput = {
  sortOrder: 1,
  name: '',
  address: '',
  lat: undefined,
  lng: undefined,
  notes: '',
  isActive: true,
}

export default function ServiceLocations() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceLocation | null>(null)
  const [form, setForm] = useState<ServiceLocationInput>(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'service-locations'],
    queryFn: () => adminServiceLocationsApi.list(),
  })

  const locations = data?.data ?? []

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return adminServiceLocationsApi.update(editing.id, form)
      }
      return adminServiceLocationsApi.create(form)
    },
    onSuccess: () => {
      toast.success(editing ? 'Location updated' : 'Location added')
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-locations'] })
      closeModal()
    },
    onError: () => toast.error('Failed to save location'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminServiceLocationsApi.remove(id),
    onSuccess: () => {
      toast.success('Location deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-locations'] })
    },
    onError: () => toast.error('Failed to delete location'),
  })

  const openCreate = () => {
    const nextOrder = locations.length
      ? Math.max(...locations.map((l) => l.sortOrder)) + 1
      : 1
    setEditing(null)
    setForm({ ...emptyForm, sortOrder: nextOrder })
    setModalOpen(true)
  }

  const openEdit = (row: ServiceLocation) => {
    setEditing(row)
    setForm({
      sortOrder: row.sortOrder,
      name: row.name,
      address: row.address,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
      notes: row.notes ?? '',
      isActive: row.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleDelete = (row: ServiceLocation) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    deleteMutation.mutate(row.id)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Service Locations"
        subtitle="Marinas, docks, and boat ramps shown in the mobile app (GET /v1/service-locations)"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add location
          </Button>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <InlineLoader />
          ) : locations.length === 0 ? (
            <EmptyState
              icon={Anchor}
              title="No locations"
              description="Default locations are seeded on first API call. Refresh this page."
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th className="w-12">#</Th>
                  <Th>Name</Th>
                  <Th>Address</Th>
                  <Th>Coordinates</Th>
                  <Th>Active</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {locations.map((row) => (
                  <Tr key={row.id}>
                    <Td className="text-gray-500 text-sm">{row.sortOrder}</Td>
                    <Td>
                      <p className="font-medium text-gray-900">{row.name}</p>
                      {row.notes ? (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{row.notes}</p>
                      ) : null}
                    </Td>
                    <Td className="text-sm text-gray-700 max-w-xs">{row.address}</Td>
                    <Td className="text-sm text-gray-600 whitespace-nowrap">
                      {row.lat != null && row.lng != null
                        ? `${row.lat.toFixed(5)}, ${row.lng.toFixed(5)}`
                        : '—'}
                    </Td>
                    <Td>
                      <span
                        className={
                          row.isActive
                            ? 'text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded'
                            : 'text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded'
                        }
                      >
                        {row.isActive ? 'Yes' : 'No'}
                      </span>
                    </Td>
                    <Td className="text-right space-x-1">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(row)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit location' : 'Add location'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                required
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[72px]"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.lat ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    lat: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.lng ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    lng: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (internal)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Visible in mobile app
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
