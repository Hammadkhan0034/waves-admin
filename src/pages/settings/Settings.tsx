import { useState } from 'react'
import { Save, Globe, Server, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

interface SettingField {
  key: string
  label: string
  description?: string
  type: 'text' | 'number' | 'toggle' | 'select'
  options?: string[]
}

const sections: { title: string; icon: React.ElementType; fields: SettingField[] }[] = [
  {
    title: 'Platform',
    icon: Globe,
    fields: [
      { key: 'platform_name', label: 'Platform Name', type: 'text' },
      { key: 'platform_currency', label: 'Default Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
      { key: 'platform_fee_pct', label: 'Platform Fee (%)', type: 'number', description: 'Percentage cut taken from each booking' },
      { key: 'tax_rate_pct', label: 'Tax Rate (%)', type: 'number' },
    ],
  },
  {
    title: 'API & Backend',
    icon: Server,
    fields: [
      { key: 'api_url', label: 'Backend API URL', type: 'text', description: 'The NestJS backend base URL' },
      { key: 'otp_cooldown', label: 'OTP Cooldown (seconds)', type: 'number' },
      { key: 'jwt_access_ttl', label: 'JWT Access TTL (minutes)', type: 'number' },
      { key: 'upload_max_mb', label: 'Max Upload Size (MB)', type: 'number' },
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

export default function Settings() {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    platform_name: 'Waves Miami',
    platform_currency: 'USD',
    platform_fee_pct: '10',
    tax_rate_pct: '7',
    api_url: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
    otp_cooldown: '45',
    jwt_access_ttl: '15',
    upload_max_mb: '10',
    require_insurance: true,
    require_vessel_reg: true,
    require_operator_license: true,
    auto_approve_operators: false,
  })

  const handleSave = () => {
    // In a real app, POST to an admin settings endpoint
    toast.success('Settings saved (UI only — connect to your settings API)')
  }

  const set = (key: string, val: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Platform configuration and preferences" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {sections.map(({ title, icon: Icon, fields }) => (
          <Card key={title}>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-600" />
                {title}
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
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
                        onClick={() => set(f.key, !values[f.key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          values[f.key] ? 'bg-brand-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            values[f.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : f.type === 'select' ? (
                      <select
                        value={String(values[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      >
                        {f.options?.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        value={String(values[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}

        {/* About */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Waves Miami Admin</p>
                <p className="text-xs text-gray-500 mt-0.5">Version 1.0.0 · Backend: {import.meta.env.VITE_API_URL ?? 'localhost:3001'}</p>
              </div>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Settings
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
