import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  )
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
    </div>
  )
}
