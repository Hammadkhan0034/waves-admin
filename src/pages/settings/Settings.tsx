import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, MapPin, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { adminSettingsApi } from '../../api/admin'

interface LocalValues {
  search_radius_meters: string
}

const DEFAULT_VALUES: LocalValues = {
  search_radius_meters: '5000',
}

export default function Settings() {
  const qc = useQueryClient()
  const [values, setValues] = useState<LocalValues>(DEFAULT_VALUES)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminSettingsApi.list(),
  })

  useEffect(() => {
    if (!data?.data) return
    const map: Record<string, string> = {}
    for (const s of data.data) map[s.key] = s.value
    setValues((prev) => ({ ...prev, ...map }))
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (key: keyof LocalValues) =>
      adminSettingsApi.update(key, values[key]),
    onSuccess: (_, key) => {
      toast.success('Setting saved')
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      console.log('Saved setting:', key, values[key])
    },
    onError: () => toast.error('Failed to save setting'),
  })

  const set = (key: keyof LocalValues, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Platform configuration managed from the admin panel" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Search Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              Search Settings
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading settings…
              </div>
            ) : (
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium text-gray-900">
                    Vessel Search Radius (metres)
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    How far from the customer's location the app will look for available vessels.
                    Default is 5000 m (5 km).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={100}
                    max={100000}
                    step={100}
                    value={values.search_radius_meters}
                    onChange={(e) => set('search_radius_meters', e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate('search_radius_meters')}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* About */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Waves Miami Admin</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Version 1.0.0 · Backend: {import.meta.env.VITE_API_URL ?? 'localhost:3001'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
