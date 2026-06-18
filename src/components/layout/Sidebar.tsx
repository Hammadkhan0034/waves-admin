import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, Ship, BookOpen,
  CreditCard, Navigation, ArrowDownToLine, Settings, LogOut, Waves,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { cn } from '../../utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/operators', label: 'Operators', icon: UserCheck },
  { to: '/vessels', label: 'Vessels', icon: Ship },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/ride-requests', label: 'Ride Requests', icon: Navigation },
  { to: '/withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { logout, user } = useAuthStore()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Waves Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold uppercase">
            {user?.phone?.slice(-2) ?? 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.profile?.name ?? 'Admin'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.phone ?? user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
