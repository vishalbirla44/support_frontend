import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import MessageBubble from '../../components/MessageBubble'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axios'
import { Send, Phone, X, Loader, Paperclip, Search } from 'lucide-react'
import FloatingCallWindow from "../../components/FloatingCallWindow";

export default function ChatWindow() {
  const { chatId } = useParams()
  const getDisplayNumber = (value) => {
    if (typeof value !== 'string' || !value.trim()) return 'Chat'
    const trimmed = value.trim()
    if (trimmed.startsWith('+')) return trimmed
    const digits = trimmed.replace(/\D/g, '')
    return digits.length >= 8 ? `+${digits}` : trimmed
  }

  const navigate = useNavigate()
  const location = useLocation()
  const { socket } = useSocket()
  const messagesEndRef = useRef(null)

  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerOnline, setCustomerOnline] = useState(false)
  const [error, setError] = useState('')
  const [typing, setTyping] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('normal')
  const [tag, setTag] = useState('new')

  // use state for calls 
  const [showCallWindow, setShowCallWindow] = useState(false);
const [callLink, setCallLink] = useState("");

  const displayNumber = getDisplayNumber(
    chat?.displayNumber ||
    chat?.customerPhone ||
    chat?.customerId?.phoneNumber ||
    chat?.customer?.phoneNumber ||
    chat?.customerNumber ||
    chat?.phoneNumber
  )

  // Load chat and messages
  useEffect(() => {
    loadChat()
  }, [chatId])

  useEffect(() => {
    if (!chat?.customerId?.phoneNumber) {
      setCustomerOnline(false)
      return
    }

    const phone = chat.customerId.phoneNumber
    const onlineCustomers = JSON.parse(localStorage.getItem('waOnlineCustomers') || '{}')
    setCustomerOnline(Boolean(onlineCustomers[phone]))
  }, [chat?.customerId?.phoneNumber])

  // Listen for new messages and presence updates
  useEffect(() => {
    if (!socket) return
socket.on('new_message', (data) => {
  if (data.chatId !== chatId) return;

  setMessages((prev) => {
    // Already exists?
    const exists = prev.some(
      (m) =>
        m._id === data.message._id ||
        m.whatsappMessageId === data.message.whatsappMessageId
    );

    if (exists) {
      return prev;
    }

    return [...prev, data.message];
  });
});

    socket.on('customer_presence', (data) => {
      if (chat?.customerId?.phoneNumber && data.phoneNumber === chat.customerId.phoneNumber) {
        setCustomerOnline(Boolean(data.online))
      }
    })

    socket.on('typing', (data) => {
      if (data.chatId === chatId) {
        setTyping(Boolean(data.typing))
      }
    })

    return () => {
      socket.off('new_message')
      socket.off('customer_presence')
      socket.off('typing')
    }
  }, [socket, chatId, chat?.customerId?.phoneNumber])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChat = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/chats/${chatId}/messages`)
      setChat(response.data.chat)
      setMessages(response.data.messages)
      setIsClosed(response.data.chat.status === 'closed')
    } catch (error) {
      console.error('Failed to load chat:', error)
      if (error.response?.status === 404) {
        navigate('/inbox')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    const messageText = message
    setMessage('')
    setSending(true)
    setError('')

    try {
      const response = await api.post(`/chats/${chatId}/reply`, {
        body: messageText
      })
      console.log("API RESPONSE", response.data);
console.log("MESSAGES", response.data.messages);

      const sentMessage = response.data?.message || response.data
      if (sentMessage) {
        setMessages((prev) => [...prev, {
          ...sentMessage,
          direction: 'out',
          body: sentMessage.body || sentMessage.text || messageText,
          timestamp: sentMessage.timestamp || new Date().toISOString(),
          status: sentMessage.status || 'sent'
        }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessage(messageText)
      setError(error.response?.data?.error || 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleCloseChat = async () => {
    if (!window.confirm('Are you sure you want to close this chat?')) return

    try {
      await api.post(`/chats/${chatId}/close`)
      setIsClosed(true)
      navigate('/inbox', { replace: true, state: { closedChatId: chatId } })
    } catch (error) {
      console.error('Failed to close chat:', error)
    }
  }

  const filteredMessages = messages.filter((msg) => {
    if (!searchTerm.trim()) return true
    const text = `${msg.body || msg.text || ''}`.toLowerCase()
    return text.includes(searchTerm.toLowerCase())
  })

  const handleTyping = (value) => {
    setMessage(value)
    if (!socket || !chatId) return
    socket.emit('typing', { chatId, typing: value.trim().length > 0 })
  }

  const handleStartCall = async () => {
    try {
      const response = await api.post('/calls/start', {
        chatId
      })
      console.log("API RESPONSE", response.data);
console.log("MESSAGES", response.data.messages);
      // window.open(response.data.callLink, '_blank')
      setCallLink(response.data.callLink);
setShowCallWindow(true);
    } catch (error) {
      console.error('Failed to start call:', error)
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
    <div className="flex h-screen">
      <EmployeeSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {displayNumber}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`status-badge ${isClosed
                    ? 'bg-gray-100 text-gray-700'
                    : customerOnline
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}
                >
                  {isClosed ? 'Closed' : customerOnline ? 'Online' : 'Offline'}
                </span>
                {chat?.customerId?.name && (
                  <span className="text-sm text-gray-500">{chat.customerId.name}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartCall}
                disabled={isClosed}
                className="btn-primary flex items-center gap-2"
              >
                <Phone size={18} />
                Call
              </button>
              <button
                onClick={handleCloseChat}
                disabled={isClosed}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isClosed
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
              >
                <X size={18} />
                Close
              </button>
              <button
                onClick={() => navigate('/inbox')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Messages */}
        <div className="border-b border-gray-200 bg-white px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages"
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex overflow-hidden bg-chat-gray">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No messages yet</p>
              </div>
            ) : (
              <>
                {filteredMessages.reduce((groups, msg, idx) => {
                  const day = new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleDateString()
                  const lastGroup = groups[groups.length - 1]
                  if (!lastGroup || lastGroup.day !== day) {
                    groups.push({ day, messages: [msg] })
                  } else {
                    lastGroup.messages.push(msg)
                  }
                  return groups
                }, []).map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <div className="mb-4 flex items-center justify-center">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                        {group.day}
                      </span>
                    </div>
                    {group.messages.map((msg, msgIndex) => {
  

  return (
    <MessageBubble
      key={`${group.day}-${msgIndex}`}
      message={msg}
      direction={msg?.direction === 'out' ? 'out' : 'in'}
    />
  );
})}
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
                      typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <aside className="hidden w-80 border-l border-gray-200 bg-white p-4 lg:block">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Customer details</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400">Name</p>
                <p className="text-sm text-gray-900">{chat?.customerId?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Phone</p>
                <p className="text-sm text-gray-900">{displayNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Received On
                </p>

                <p className="text-sm text-gray-900">
                  {chat?.whatsappInstance || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Status</p>
                <p className="text-sm text-gray-900">{customerOnline ? 'Online now' : 'Offline'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Conversation</p>
                <p className="text-sm text-gray-900">{messages.length} messages</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Received On
                </p>

                <p className="text-sm text-gray-900">
                  {chat?.whatsappInstance || "Unknown"}
                </p>
              </div>

            </div>
          </aside>
        </div>

        {/* Input Area */}
        {!isClosed ? (
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white p-4">
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-3 items-end">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu((prev) => !prev)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Paperclip size={20} className="text-gray-600" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field w-full"
                  disabled={sending}
                />
                {showAttachmentMenu && (
                  <div className="absolute bottom-12 left-0 flex gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <button type="button" className="rounded-lg bg-gray-100 px-3 py-2 text-sm">📎 File</button>
                    <button type="button" className="rounded-lg bg-gray-100 px-3 py-2 text-sm">📷 Image</button>
                    <button type="button" className="rounded-lg bg-gray-100 px-3 py-2 text-sm">😊 Emoji</button>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="btn-primary p-2 disabled:opacity-50"
              >
                {sending ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-t border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-gray-600 text-sm">This chat is closed</p>
          </div>
        )}
      </div>
      {showCallWindow && (
  <FloatingCallWindow
    callLink={callLink}
    onClose={() => setShowCallWindow(false)}
  />
)}
    </div>
    
  )
}