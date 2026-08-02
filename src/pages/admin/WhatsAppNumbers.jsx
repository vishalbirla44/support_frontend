import React, { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import QRModal from '../../components/QRModal'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axios'
import { Plus, Loader, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react'

export default function WhatsAppNumbers() {
  const { socket } = useSocket()
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [error, setError] = useState(null)   // ← new: page-level error
  const [connectError, setConnectError] = useState(null) // ← new: connect button error

  useEffect(() => {
    loadNumbers()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('whatsapp_qr', (data) => {
      setQrCode(data.qr)
      setQrLoading(false)
      setConnectError(null)
    })

    socket.on('whatsapp_status', (data) => {
      setNumbers((prev) =>
        prev.map((num) =>
          num._id === data.numberId || num.id === data.numberId
            ? { ...num, status: data.status }
            : num
        )
      )
      if (data.status === 'connected') {
        setShowQRModal(false)
        setQrCode(null)
        loadNumbers()
      }
    })

    return () => {
      socket.off('whatsapp_qr')
      socket.off('whatsapp_status')
    }
  }, [socket])

  const loadNumbers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/admin/numbers')
      setNumbers(response.data.numbers || [])
    } catch (err) {
      console.error('Failed to load numbers:', err)
      setError('Failed to load WhatsApp numbers. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectNew = async () => {
    setConnectError(null)
    setQrLoading(true)
    setShowQRModal(true)
    setQrCode(null)

    try {
      await api.post('/admin/numbers')
      // QR will arrive via socket event 'whatsapp_qr'
    } catch (err) {
      console.error('Failed to start QR process:', err)

      // Parse the error message from backend
      const serverMsg = err.response?.data?.error || err.response?.data?.message || ''

      let userMsg = 'Failed to connect. Please try again.'

      if (serverMsg.includes('E11000') || serverMsg.includes('duplicate key')) {
        userMsg = 'A pending connection already exists. Please wait a moment and try again, or refresh the page.'
      } else if (err.response?.status === 400) {
        userMsg = serverMsg || 'Invalid request. Please try again.'
      } else if (err.response?.status === 500) {
        userMsg = 'Server error. Please try again in a few seconds.'
      }

      setConnectError(userMsg)
      setQrLoading(false)
      setShowQRModal(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-700'
      case 'disconnected': return 'bg-red-100 text-red-700'
      case 'reconnecting': return 'bg-yellow-100 text-yellow-700'
      case 'connecting':
      case 'qr_ready': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // for remove section   

  const handleRemove = async (numberId) => {
    if (!window.confirm('Remove this WhatsApp number? It will be disconnected immediately.')) return
    try {
      await api.delete(`/admin/numbers/${numberId}`)
      loadNumbers()
    } catch (error) {
      console.error('Failed to remove number:', error)
      alert('Failed to remove number. Please try again.')
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'disconnected': return 'Disconnected'
      case 'reconnecting': return 'Reconnecting...'
      case 'connecting': return 'Connecting...'
      case 'qr_ready': return 'Scan QR'
      default: return 'Unknown'
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Numbers</h1>
            <p className="text-gray-600 mt-1">Manage your connected WhatsApp numbers</p>
          </div>
          <button
            onClick={handleConnectNew}
            disabled={qrLoading || numbers.length >= 8}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {qrLoading ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
            {qrLoading ? 'Starting...' : 'Connect New Number'}
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Page-level load error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <button
                onClick={loadNumbers}
                className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {/* Connect error banner */}
          {connectError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-orange-800 text-sm font-medium">Connection Failed</p>
                <p className="text-orange-700 text-sm mt-0.5">{connectError}</p>
              </div>
              <button
                onClick={() => setConnectError(null)}
                className="text-orange-400 hover:text-orange-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Empty state */}
          {numbers.length === 0 && !error ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No WhatsApp Numbers Connected</h2>
              <p className="text-gray-500 mb-6">Connect your first WhatsApp number to get started</p>
              <button
                onClick={handleConnectNew}
                disabled={qrLoading}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Connect First Number
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {numbers.map((number) => (
                <div
                  key={number._id || number.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#25D366] rounded-lg flex items-center justify-center">
                      <MessageSquare className="text-white" size={24} />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(number.status)}`}>
                      {getStatusLabel(number.status)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-0.5">Phone Number</p>
                  <p className="text-base font-bold text-gray-900 mb-3 font-mono">
                    {number.phoneNumber || 'Not assigned yet'}
                  </p>

                  <p className="text-xs text-gray-500 mb-0.5">Label</p>
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    {number.label || 'Untitled'}
                  </p>

                  {number.status === 'connected' && (
                    <button
                      onClick={() => navigator.clipboard.writeText(number.phoneNumber)}
                      className="w-full text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                    >
                      Copy Number
                    </button>
                  )}

                  {number.status === 'disconnected' && (
                    <button
                      onClick={handleConnectNew}
                      className="w-full text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                    >
                      Reconnect
                    </button>
                  )}

                  {(number.status === 'reconnecting' || number.status === 'connecting') && (
                    <div className="w-full py-2 bg-yellow-50 rounded-lg text-center">
                      <Loader className="inline animate-spin text-yellow-600" size={14} />
                      <span className="text-xs text-yellow-700 ml-2">
                        {number.status === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(number._id)}
                    className="w-full mt-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200 hover:bg-red-100 transition"
                  >
                    Remove Number
                  </button>
                </div>
              ))}

              {/* Add new slot */}
              {numbers.length < 8 && (
                <button
                  onClick={handleConnectNew}
                  disabled={qrLoading}
                  className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 flex items-center justify-center hover:bg-gray-50 hover:border-[#25D366] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="text-center">
                    <Plus className="mx-auto text-gray-400 group-hover:text-[#25D366] mb-2 transition-colors" size={32} />
                    <p className="text-gray-500 group-hover:text-gray-700 font-medium text-sm transition-colors">
                      Add New Number
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <QRModal
        isOpen={showQRModal}
        qrBase64={qrCode}
        onClose={() => {
          setShowQRModal(false)
          setQrCode(null)
          setConnectError(null)
        }}
      />
    </div>
  )
}