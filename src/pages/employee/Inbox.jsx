import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import ChatCard from '../../components/ChatCard'
import ChatWindow from './ChatWindow'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axios'
import { Search, Loader, Filter } from 'lucide-react'

export default function Inbox() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chatId } = useParams()
  const { socket } = useSocket()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showNewNumberComposer, setShowNewNumberComposer] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState([])
  const [selectedNumberId, setSelectedNumberId] = useState('')
  const [newRecipientNumber, setNewRecipientNumber] = useState('')
  const [newNumberMessage, setNewNumberMessage] = useState('')
  const [sendingNewNumber, setSendingNewNumber] = useState(false)
  const [newNumberError, setNewNumberError] = useState('')

  // Load chats on mount
  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    if (location.state?.closedChatId) {
      setChats((prevChats) => prevChats.filter((chat) => String(chat.id || chat._id) !== String(location.state.closedChatId)))
    }
  }, [location.state?.closedChatId])

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return

    socket.on('new_message', (data) => {
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (String(chat._id || chat.id) === String(data.chatId)) {
            return {
              ...chat,
              messages: [data.message, ...chat.messages],
              unreadCount: data.isFromCustomer ? chat.unreadCount + 1 : chat.unreadCount
            }
          }
          return chat
        })
        return updatedChats.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        )
      })
    })

    socket.on('chat_assigned', (data) => {
  setChats((prevChats) => {
    const exists = prevChats.find(
      (chat) =>
        String(chat._id || chat.id) ===
        String(data.chat._id || data.chat.id)
    );

    if (exists) {
      return prevChats.map((chat) =>
        String(chat._id || chat.id) ===
        String(data.chat._id || data.chat.id)
          ? data.chat
          : chat
      );
    }

    return [data.chat, ...prevChats];
  });
});

    // 👇 ADD THIS HERE
   socket.on('chat_closed', (data) => {
  setChats((prev) =>
    prev.filter(
      (chat) =>
        String(chat._id || chat.id) !==
        String(data.chatId)
    )
  );
});

    return () => {
      socket.off('new_message')
      socket.off('chat_assigned')
      socket.off('chat_closed')
    }
  }, [socket])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chats/mine')
      const loadedChats = (response.data.chats || response.data || [])
        .filter((chat) => chat.status !== 'closed')
        .map((chat) => ({
          ...chat,
          id: chat.id || chat._id || `${chat.customerNumber || 'chat'}-${Math.random().toString(36).slice(2, 9)}`
        }))
      setChats(loadedChats)
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayValue = (chat) => {
   
    const raw = [
      chat.displayNumber,
      chat.customerPhone,
      chat.customerId?.phoneNumber,
      chat.customer?.phoneNumber,
      chat.customerId?.customerId,
      chat.customer?.customerId,
      chat.customerNumber,
      chat.phoneNumber,
      chat.customer?.phone,
      chat.customerId?.phone,
      chat.contact?.phoneNumber,
      chat.contact?.phone,
      chat.senderPhone,
      chat.sender?.phoneNumber,
      chat.sender?.phone
    ].find((value) => value && String(value).trim())

    return typeof raw === 'string' ? raw : ''
  }

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = getDisplayValue(chat).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUnread = !showUnreadOnly || (chat.unreadCount || 0) > 0
    return chat.status !== 'closed' && matchesSearch && matchesUnread
  })

  const handleToggleNewNumberComposer = async () => {
    if (!showNewNumberComposer) {
      try {
        const response = await api.get('/chats/active-numbers')
        const numbers = response.data?.numbers || []
        setAvailableNumbers(numbers)
        if (!selectedNumberId && numbers.length) {
          setSelectedNumberId(numbers[0]._id)
        }
      } catch (error) {
        console.error('Failed to load active numbers:', error)
      }
    }

    setShowNewNumberComposer((prev) => !prev)
    setNewNumberError('')
  }

  const handleSendToNewNumber = async (e) => {
    e.preventDefault()
    if (!newRecipientNumber.trim() || !newNumberMessage.trim() || sendingNewNumber) return

    setSendingNewNumber(true)
    setNewNumberError('')

    try {
      const response = await api.post('/chats/new', {
        phoneNumber: newRecipientNumber,
        customerName: newRecipientNumber,
        message: newNumberMessage,
        whatsappNumberId: selectedNumberId || undefined
      })

      if (response.data?.success) {
        setNewRecipientNumber('')
        setNewNumberMessage('')
        setShowNewNumberComposer(false)
      }
    } catch (error) {
      console.error('Failed to send new number message:', error)
      setNewNumberError(error.response?.data?.error || 'Failed to send message. Please try again.')
    } finally {
      setSendingNewNumber(false)
    }
  }

  if (chatId) {
    return <ChatWindow />
  }

  return (
    <div className="flex h-screen bg-white">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Customer Chats</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleNewNumberComposer}
                className="rounded-full border border-whatsapp/20 bg-green-50 px-3 py-2 text-sm font-medium text-whatsapp transition-colors hover:bg-green-100"
              >
                New Number
              </button>
              <button
                type="button"
                onClick={() => setShowUnreadOnly((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${showUnreadOnly ? 'bg-whatsapp text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Filter size={16} />
                {showUnreadOnly ? 'Unread only' : 'All chats'}
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {showNewNumberComposer && (
            <form onSubmit={handleSendToNewNumber} className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-gray-800">Send to a new number</h2>
                <span className="text-xs text-gray-500">Connected numbers</span>
              </div>

              {newNumberError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {newNumberError}
                </div>
              )}

              <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr]">
                <select
                  value={selectedNumberId}
                  onChange={(e) => setSelectedNumberId(e.target.value)}
                  className="input-field"
                >
                  {availableNumbers.length === 0 ? (
                    <option value="">No connected active numbers</option>
                  ) : (
                    availableNumbers.map((number) => (
                      <option key={number._id} value={number._id}>
                        {number.displayLabel || number.label || number.phoneNumber || `Number ${number.instanceIndex + 1}`}
                      </option>
                    ))
                  )}
                </select>

                <input
                  type="text"
                  value={newRecipientNumber}
                  onChange={(e) => setNewRecipientNumber(e.target.value)}
                  placeholder="Recipient phone number"
                  className="input-field"
                />
              </div>

              <textarea
                value={newNumberMessage}
                onChange={(e) => setNewNumberMessage(e.target.value)}
                placeholder="Type your message here..."
                rows="3"
                className="input-field mt-3 min-h-[90px] resize-none"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!newRecipientNumber.trim() || !newNumberMessage.trim() || sendingNewNumber || availableNumbers.length === 0}
                  className="btn-primary disabled:opacity-50"
                >
                  {sendingNewNumber ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="animate-spin text-whatsapp mx-auto mb-2" size={32} />
                <p className="text-gray-600">Loading chats...</p>
              </div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 text-lg font-medium">No customer chats yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  New customer conversations will appear here with their phone number.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {filteredChats.map((chat, index) => (
                <ChatCard
                  key={chat.id || `${chat.customerNumber || 'chat'}-${index}`}
                  chat={chat}
                  isActive={String(chat.id || chat._id) === String(chatId)}
                  onClick={() => navigate(`/inbox/${chat.id || chat._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}