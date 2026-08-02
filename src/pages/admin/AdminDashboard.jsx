import React, { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import StatCard from '../../components/StatCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axios'
import { MessageSquare, Users, Clock, Phone, Loader } from 'lucide-react'

export default function AdminDashboard() {
  const { socket } = useSocket()
  const [dashboard, setDashboard] = useState(null)
  const [employees, setEmployees] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  // Listen for employee status changes
  useEffect(() => {
    if (!socket) return

    socket.on('employee_status_changed', (data) => {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === data.employeeId
            ? { ...emp, isOnline: data.isOnline }
            : emp
        )
      )
    })

    return () => {
      socket.off('employee_status_changed')
    }
  }, [socket])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/dashboard')
      console.log(response.data);
      setDashboard(response.data);
      setDashboard(response.data)
      setEmployees(response.data.employees || [])

      // Transform messages per hour data for chart
      if (response.data.messagesPerHour) {
        const chartData = response.data.messagesPerHour.map((item) => ({
          time: `${item.hour}:00`,
          messages: item.count
        }))
        setChartData(chartData)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-whatsapp" size={40} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-chat-gray">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your support system</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Messages Today"
              value={dashboard?.messagesToday   || 0}
              icon={MessageSquare}
              color="whatsapp"
            />
            <StatCard
              title="Employees Online"
              value={dashboard?.employeesOnline || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Avg Response Time"
              value={dashboard?.avgResponseTime || '-'}
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="Active Calls"
              value={dashboard?.activeCalls || 0}
              icon={Phone}
              color="purple"
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Messages per Hour (Today)</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#25D366"
                    dot={{ fill: '#25D366', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No data available yet</p>
              </div>
            )}
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Employees</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Messages Today</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Avg Response</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      console.log("this is emp",employees),
                      <tr key={emp._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.employeeId}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`status-badge ${
                              emp.isOnline
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {emp.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.messagesToday || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.avgResponseTime || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}