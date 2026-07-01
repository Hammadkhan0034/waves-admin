import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Globe, Server, Shield, MapPin, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { adminSettingsApi } from '../../api/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = 'text' | 'number' | 'toggle' | 'select'

interface SettingField {
  key: string
  label: string
  description?: string
  type: FieldType
  options?: string[]
  min?: number
  max?: number
}

interface Section {
  title: string
  icon: React.ElementType
  fields: SettingField[]
}

// ─── Section definitions ──────────────────────────────────────────────────────

const sections: Section[] = [
  {
    title: 'Platform',
    icon: Globe,
    fields: [
      { key: 'platform_name', label: 'Platform Name', type: 'text' },
      { key: 'platform_currency', label: 'Default Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
      { key: 'platform_fee_pct', label: 'Platform Fee (%)', type: 'number', description: 'Percentage cut taken from each booking', min: 0, max: 100 },
      { key: 'tax_rate_pct', label: 'Tax Rate (%)', type: 'number', min: 0, max: 100 },
    ],
  },
  {
    title: 'API & Backend',
    icon: Server,
    fields: [
      { key: 'api_url', label: 'Backend API URL', type: 'text', description: 'The NestJS backend base URL' },
      { key: 'otp_cooldown', label: 'OTP Cooldown (seconds)', type: 'number', min: 10 },
      { key: 'jwt_access_ttl', label: 'JWT Access TTL (minutes)', type: 'number', min: 1 },
      { key: 'upload_max_mb', label: 'Max Upload Size (MB)', type: 'number', min: 1 },
    ],
  },
  {
    title: 'Search',
    icon: MapPin,
    fields: [
      {
        key: 'search_radius_meters',
        label: 'Vessel Search Radius (metres)',
        type: 'number',
        description: 'How far from the customer\'s location the app will look for available vessels. Default 5000 m.',
        min: 100,
        max: 100000,
      },
    ],
  },
  {
    title: 'Operator Onboarding',
    icon: Shield,
    fields: [
      { key: 'require_insurance', label: 'Require Insurance Doc', type: 'toggle' },
      { key: 'require_vessel_reg', label: 'Require Vessel Registration', type: 'toggle' },
      { key: 'require_operator_license', label: 'Require Operator License', type: 'toggle' },
      { key: 'auto_approve_operators', label: 'Auto-Approve Operators', type: 'toggle', description: 'Skips manual admin review' },
    ],
  },
]

// ─── Defaults (used before DB values load) ────────────────────────────────────

const DEFAULTS: Record<string, string> = {
  platform_name: 'Waves Miami',
  platform_currency: 'USD',
  platform_fee_pct: '10',
  tax_rate_pct: '7',
  api_url: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  otp_cooldown: '45',
  jwt_access_ttl: '15',
  upload_max_mb: '10',
  search_radius_meters: '5000',
  require_insurance: 'true',
  require_vessel_reg: 'true',
  require_operator_license: 'true',
  auto_approve_operators: 'false',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS)
  const [savingSection, setSavingSection] = useState<string | null>(null)

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
    mutationFn: (entries: { key: string; value: string }[]) =>
      Promise.all(entries.map((e) => adminSettingsApi.update(e.key, e.value))),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      setSavingSection(null)
    },
    onError: () => {
      toast.error('Failed to save settings')
      setSavingSection(null)
    },
  })

  const handleSaveSection = (section: Section) => {
    setSavingSection(section.title)
    const entries = section.fields.map((f) => ({ key: f.key, value: values[f.key] ?? '' }))
    saveMutation.mutate(entries)
  }

  const set = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  const isBusy = (sectionTitle: string) =>
    saveMutation.isPending && savingSection === sectionTitle

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Platform configuration and preferences" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {sections.map((section) => {
          const { title, icon: Icon, fields } = section
          return (
            <Card key={title}>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-brand-600" />
                  {title}
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <>
                    {fields.map((f) => (
                      <div key={f.key} className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-medium text-gray-900">{f.label}</label>
                          {f.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {f.type === 'toggle' ? (
                            <button
                              onClick={() => set(f.key, values[f.key] === 'true' ? 'false' : 'true')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                values[f.key] === 'true' ? 'bg-brand-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                  values[f.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : f.type === 'select' ? (
                            <select
                              value={values[f.key] ?? ''}
                              onChange={(e) => set(f.key, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            >
                              {f.options?.map((o) => <option key={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              type={f.type}
                              min={f.min}
                              max={f.max}
                              value={values[f.key] ?? ''}
                              onChange={(e) => set(f.key, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleSaveSection(section)}
                        disabled={saveMutation.isPending}
                      >
                        {isBusy(title) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save {title}
                      </Button>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          )
        })}

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
