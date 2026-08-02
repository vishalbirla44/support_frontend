import React, { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import EmployeeRow from '../../components/EmployeeRow'
import CopyLinkButton from '../../components/CopyLinkButton'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axios'
import { Plus, Loader, AlertCircle, Check, Copy } from 'lucide-react'

export default function EmployeeManagement() {
  const { socket } = useSocket()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultData, setResultData] = useState(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employee')

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEmployees()
  }, [])

  // Listen for employee status changes
  useEffect(() => {
    if (!socket) return

    socket.on('employee_status_changed', (data) => {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === data.employeeId || emp.id === data.employeeId
            ? { ...emp, status: data.status }
            : emp
        )
      )
    })

    return () => {
      socket.off('employee_status_changed')
    }
  }, [socket])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/employees')
      // Backend returns { employees: [...] }
      const list = response.data.employees || response.data
      // Normalize _id to id
      setEmployees(list.map((emp) => ({ ...emp, id: emp._id })))
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmployee = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setCreating(true)
    setError('')

    try {
      const response = await api.post('/admin/employees', {
        name,
        email,
        password,
        role,
      })

      // Backend returns { employee: {...} }
      const emp = response.data.employee || response.data
      setResultData({
        ...emp,
        id: emp._id,
        password: password, // show the plain password once
        tempToken: emp.loginToken || '',
      })

      setShowResultModal(true)
      setShowAddModal(false)
      setName('')
      setEmail('')
      setPassword('')
      setRole('employee')
      loadEmployees()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create employee')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (employeeId) => {
    const employee = employees.find((e) => e._id === employeeId || e.id === employeeId)
    const newName = prompt('Enter new name:', employee.name)
    if (!newName || newName === employee.name) return

    try {
      await api.put(`/admin/employees/${employeeId}`, { name: newName })
      loadEmployees()
    } catch (error) {
      console.error('Failed to edit employee:', error)
    }
  }

  const handleResetPassword = async (employeeId) => {
    const newPassword = prompt('Enter new password for this employee:')
    if (!newPassword) return

    try {
      await api.put(`/admin/employees/${employeeId}`, { password: newPassword })
      alert(`Password updated successfully!\nNew password: ${newPassword}\n\nSave this now — it won't be shown again.`)
    } catch (error) {
      console.error('Failed to reset password:', error)
      alert('Failed to reset password. Please try again.')
    }
  }

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? Their chats will be reassigned.')) return

    try {
      await api.delete(`/admin/employees/${employeeId}`)
      loadEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
    }
  }

  const loginLink = resultData
    ? `${window.location.origin}/login?token=${resultData.tempToken || ''}`
    : ''

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-green-500" size={40} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600 mt-1">Manage your support team</p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1ebe59] transition"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Messages</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Avg Response</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No employees found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <EmployeeRow
                        key={emp._id}
                        employee={emp}
                        onEdit={handleEdit}
                        onResetPassword={handleResetPassword}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Employee Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                  disabled={creating}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                  disabled={creating}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a login password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                  disabled={creating}
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                  disabled={creating}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe59] disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  disabled={creating}
                >
                  {creating && <Loader size={16} className="animate-spin" />}
                  {creating ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Result Modal ───────────────────────────────────────────────── */}
      {showResultModal && resultData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowResultModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 bg-green-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <Check className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Employee Created!</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Name</label>
                <p className="text-base font-medium text-gray-900 mt-1">{resultData.name}</p>
              </div>

              {/* Employee ID */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Employee ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base font-mono font-medium text-gray-900">{resultData.employeeId}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(resultData.employeeId)}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Copy"
                  >
                    <Copy size={15} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Password (shown once)</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base font-mono font-medium text-gray-900">{resultData.password}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(resultData.password)}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Copy"
                  >
                    <Copy size={15} className="text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠️ Save this password now — it won't be shown again
                </p>
              </div>

              {/* Login Link */}
              {resultData.tempToken && (
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Login Link</label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    Send this to the employee — they enter their password to log in
                  </p>
                  <CopyLinkButton url={loginLink} label="Copy Login Link" />
                </div>
              )}

              <button
                onClick={() => setShowResultModal(false)}
                className="w-full px-4 py-2 rounded-lg bg-[#25D366] text-white font-medium hover:bg-[#1ebe59] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}