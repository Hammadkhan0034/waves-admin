import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, Ship, BookOpen, CreditCard,
  Navigation, TrendingUp, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Header } from '../../components/layout/Header'
import { StatCard } from '../../components/common/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { InlineLoader } from '../../components/common/PageLoader'
import { adminUsersApi, adminOperatorsApi, adminVesselsApi, adminBookingsApi } from '../../api/admin'
import { formatAmount } from '../../utils'

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users', 'summary'],
    queryFn: () => adminUsersApi.list({ limit: 1 }),
  })

  const { data: operatorsData, isLoading: loadingOperators } = useQuery({
    queryKey: ['admin', 'operators', 'summary'],
    queryFn: () => adminOperatorsApi.list({ limit: 1 }),
  })

  const { data: pendingVessels, isLoading: loadingVessels } = useQuery({
    queryKey: ['admin', 'vessels', 'pending', 'summary'],
    queryFn: () => adminVesselsApi.listPending({ limit: 1 }),
  })

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['admin', 'bookings', 'summary'],
    queryFn: () => adminBookingsApi.list({ limit: 10 }),
  })

  const { data: pendingOperators } = useQuery({
    queryKey: ['admin', 'operators', 'pending'],
    queryFn: () => adminOperatorsApi.list({ status: 'pending', limit: 1 }),
  })

  const { data: completedBookings } = useQuery({
    queryKey: ['admin', 'bookings', 'completed'],
    queryFn: () => adminBookingsApi.list({ status: 'completed', limit: 1 }),
  })

  const isLoading = loadingUsers || loadingOperators || loadingVessels || loadingBookings

  const totalRevenue = bookingsData?.data.data
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalAmount ?? 0), 0) ?? 0

  // Booking status breakdown for pie chart
  const bookingStatusData = [
    { name: 'Completed', value: completedBookings?.data.total ?? 0 },
    { name: 'Pending', value: (bookingsData?.data.total ?? 0) - (completedBookings?.data.total ?? 0) },
  ].filter((d) => d.value > 0)

  // Mock chart data for monthly bookings (replace with real endpoint if available)
  const monthlyData = [
    { month: 'Jan', bookings: 24, revenue: 4800 },
    { month: 'Feb', bookings: 31, revenue: 6200 },
    { month: 'Mar', bookings: 45, revenue: 9000 },
    { month: 'Apr', bookings: 52, revenue: 10400 },
    { month: 'May', bookings: 38, revenue: 7600 },
    { month: 'Jun', bookings: 60, revenue: 12000 },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Dashboard" subtitle="Overview of your Waves Miami platform" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <InlineLoader />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Users"
                value={usersData?.data.total ?? 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                label="Operators"
                value={operatorsData?.data.total ?? 0}
                icon={UserCheck}
                color="green"
              />
              <StatCard
                label="Pending Vessels"
                value={pendingVessels?.data.total ?? 0}
                icon={Ship}
                color="yellow"
              />
              <StatCard
                label="Total Bookings"
                value={bookingsData?.data.total ?? 0}
                icon={BookOpen}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Pending Operators"
                value={pendingOperators?.data.total ?? 0}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                label="Completed Bookings"
                value={completedBookings?.data.total ?? 0}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                label="Est. Revenue (last 10)"
                value={formatAmount(totalRevenue)}
                icon={CreditCard}
                color="blue"
              />
              <StatCard
                label="Ride Requests"
                value="—"
                icon={Navigation}
                color="purple"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Bookings & Revenue</h3>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Bookings" />
                      <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Pie chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-gray-900">Booking Status</h3>
                </CardHeader>
                <CardBody>
                  {bookingStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={bookingStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {bookingStatusData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
                      No booking data yet
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Recent Bookings</h3>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookingsData?.data.data.slice(0, 5).map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.id.slice(0, 8)}…</td>
                        <td className="px-4 py-3 capitalize">{b.category}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            b.status === 'completed' ? 'bg-green-100 text-green-800' :
                            b.status === 'canceled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {b.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatAmount(b.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!bookingsData?.data.data.length && (
                  <div className="text-center py-8 text-gray-400 text-sm">No bookings yet</div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
