import React, { useState, useEffect, useRef } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import MessageBubble from '../../components/MessageBubble'
import api from '../../api/axios'
import { Search, ChevronDown, Loader } from 'lucide-react'

export default function AllChats() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('all')
  const [expandedChat, setExpandedChat] = useState(null)
  const [employees, setEmployees] = useState([])
  const [reassigning, setReassigning] = useState(null)
  const searchTimeout = useRef(null)

  useEffect(() => {
    loadChats()
    loadEmployees()

  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadChats()
    }, 400)
  }, [searchTerm, status])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/chats', {
        params: {
          search: searchTerm,
          status: status === 'all' ? undefined : status
        }
      })
      console.log(response.data)
      setChats(response.data.chats || [])

    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }
  const loadEmployees = async () => {
    try {
      const response = await api.get('/admin/employees')

      console.log("EMPLOYEE RESPONSE", response.data)

      setEmployees(response.data.employees || [])
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }
  const handleReassign = async (chatId, employeeId) => {
    setReassigning(chatId)
    try {
      await api.put(`/admin/chats/${chatId}/reassign`, {
        employeeId
      })
      loadChats()
    } catch (error) {
      console.error('Failed to reassign chat:', error)
    } finally {
      setReassigning(null)
    }
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex h-screen bg-chat-gray">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">All Chats</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by phone number or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Chats</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-whatsapp" size={40} />
            </div>
          ) : chats.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">No chats found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => (
                <div key={chat._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() =>
                      setExpandedChat(expandedChat === chat._id ? null : chat._id)
                    }
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-bold text-gray-900">{chat.customerNumber}</h3>
                        <span
                          className={`status-badge text-xs ${chat.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {chat.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {chat.messages?.length
                          ? chat.messages[chat.messages.length - 1].body
                          : 'No messages'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Assigned: {chat.assignedTo?.name || 'Unassigned'}</span>
                        <span>Last: {formatTime(chat.updatedAt)}</span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`text-gray-400 transition-transform ${expandedChat === chat._id ? 'rotate-180' : ''
                        }`}
                      size={20}
                    />
                  </button>

                  {/* Expanded Content */}
                  {expandedChat === chat._id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      {/* Messages */}
                      <div className="bg-white rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                        <div className="space-y-3">
                          {chat.messages?.slice(0, 10).map((msg, idx) => (
                            <div key={idx}>
                              <div key={idx}>
                                <div
                                  className={`text-xs text-gray-500 mb-1 ${msg.direction === 'out'
                                      ? 'text-right pr-2'
                                      : 'text-left pl-2'
                                    }`}
                                >
                                  {msg.direction === 'out'
                                    ? `Employee: ${msg.sentByEmployee?.name || 'Unknown'}`
                                    : 'Customer'}
                                </div>

                                <MessageBubble
                                  message={msg}
                                  direction={msg.direction}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reassign to
                          </label>
                          <select
                            onChange={(e) =>
                              handleReassign(chat._id, e.target.value)
                            }
                            disabled={reassigning === chat._id}
                            className="input-field"
                          >
                            <option value="">Select employee...</option>
                            {employees.map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="pt-6">
                          {reassigning === chat._id && (
                            <Loader className="animate-spin text-whatsapp" size={20} />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        <strong>Created:</strong> {formatDate(chat.createdAt)} |{' '}
                        <strong>Last Active:</strong> {formatTime(chat.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}