import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: string; up?: boolean }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

export function StatCard({ label, value, icon: Icon, trend, color = 'blue' }: Props) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={cn('text-xs mt-1 font-medium', trend.up ? 'text-green-600' : 'text-red-500')}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}
