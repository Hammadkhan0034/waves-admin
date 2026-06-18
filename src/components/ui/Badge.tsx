import { cn, statusColor } from '../../utils'

interface Props {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        statusColor(status),
        className
      )}
    >
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'red' | 'yellow'
  className?: string
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
