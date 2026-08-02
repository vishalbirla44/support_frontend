import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../api/axios'

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function CallLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/call-logs')
      const payload = res.data?.logs || res.data || []
      const sorted = [...payload].sort(
        (a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt)
      )

      const normalized = sorted.map((log) => ({
        ...log,
        agentName: log.agentName || log.employeeName || log.employeeId?.name || '—',
        employeeName: log.employeeName || log.agentName || log.employeeId?.name || '—',
        employeeCode: log.employeeCode || log.employeeId?.employeeId || null,
        customerNumber: log.customerNumber || log.chatId?.customerNumber || log.from || '—',
      }))

      setLogs(normalized)
    } catch (err) {
      try {
        const fallback = await api.get('/admin/calllogs')
        const payload = fallback.data?.logs || fallback.data || []
        const sorted = [...payload].sort(
          (a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt)
        )
        const normalized = sorted.map((log) => ({
          ...log,
          agentName: log.agentName || log.employeeName || log.employeeId?.name || '—',
          employeeName: log.employeeName || log.agentName || log.employeeId?.name || '—',
          employeeCode: log.employeeCode || log.employeeId?.employeeId || null,
          customerNumber: log.customerNumber || log.chatId?.customerNumber || log.from || '—',
        }))
        setLogs(normalized)
      } catch (fallbackErr) {
        setError('Failed to load call logs. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
            <p className="text-sm text-gray-500 mt-0.5">All agent–customer voice calls</p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading call logs…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No call logs yet</p>
              <p className="text-sm text-gray-400">Calls will appear here once agents start making them.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Summary strip */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="text-sm text-gray-500">{logs.length} total call{logs.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Number</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Started At</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log, idx) => (
                      <tr key={log._id || idx} className="hover:bg-gray-50 transition-colors">
                        {/* Agent */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-green-700">
                                {(log.agentName || log.employeeName || 'A').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{log.agentName || log.employeeName || '—'}</p>
                              {(log.employeeCode || log.agentId || log.employeeId) && (
                                <p className="text-xs text-gray-400">{log.employeeCode || log.agentId || log.employeeId}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer Number */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-gray-800">{log.customerNumber || log.from || '—'}</span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(log.startedAt || log.createdAt)}
                        </td>

                        {/* Started At */}
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(log.startedAt || log.createdAt)}
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(log.duration || log.durationSeconds)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {log.status === 'missed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Missed
                            </span>
                          ) : log.status === 'ongoing' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                              Ongoing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}