import React, { useState, useEffect } from 'react'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import StatCard from '../../components/StatCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'
import { MessageSquare, Clock, Phone, TrendingUp, Loader } from 'lucide-react'

export default function MyStats() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chats/my-stats')
      setStats(response.data)

      // Transform data for chart
      if (response.data.messagesPerDay) {
        const chartData = response.data.messagesPerDay.map((item) => ({
          day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          messages: item.count
        }))
        setChartData(chartData)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <EmployeeSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-whatsapp" size={40} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-chat-gray">
      <EmployeeSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900">Performance Statistics</h1>
          <p className="text-gray-600 mt-1">Your activity and metrics</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Customers Today"
              value={stats?.customersToday || 0}
              icon={MessageSquare}
              color="whatsapp"
            />

            <StatCard
              title="New Chats Today"
              value={stats?.newChatsToday || 0}
              icon={TrendingUp}
              color="blue"
            />

            <StatCard
              title="Closed Chats Today"
              value={stats?.closedChatsToday || 0}
              icon={Clock}
              color="orange"
            />

            <StatCard
              title="Pending Chats"
              value={stats?.pendingChats || 0}
              icon={Phone}
              color="purple"
            />
          
            <StatCard
              title="Avg Response Time"
              value={stats?.avgResponseTime || '-'}
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="Calls Made"
              value={stats?.callsMade || 0}
              icon={Phone}
              color="purple"
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Customers per Day  (Last 7 Days)</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="messages" fill="#25D366" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No data available yet</p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
  <div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">
    This Week
  </h3>

  <div className="space-y-3">

    <div className="flex justify-between items-center">
      <span className="text-gray-600">
        Customers Contacted
      </span>

      <span className="font-semibold text-green-600">
        {stats?.customersThisWeek || 0}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-600">
        New Chats
      </span>

      <span className="font-semibold text-blue-600">
        {stats?.newChatsThisWeek || 0}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-600">
        Closed Chats
      </span>

      <span className="font-semibold text-red-600">
        {stats?.closedChatsThisWeek || 0}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-600">
        Pending Chats
      </span>

      <span className="font-semibold text-orange-600">
        {stats?.pendingChats || 0}
      </span>
    </div>

    <div className="border-t pt-3 mt-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-700 font-medium">
          Avg Customers / Day
        </span>

        <span className="font-bold text-gray-900">
          {Math.round((stats?.customersThisWeek || 0) / 7)}
        </span>
      </div>
    </div>

  </div>
</div>
</div>
        </div>
      </div>
    </div>
  )
}   