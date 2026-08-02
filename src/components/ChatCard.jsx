import React from 'react'
import { formatDate } from '../utils/formatTime'

export default function ChatCard({ chat, isActive, onClick }) {
  const lastMessage = chat.messages?.[0]?.body || chat.messages?.[0]?.text || 'No messages yet'
  const lastTime = chat.messages?.[0]?.timestamp || chat.updatedAt

  const normalizeNumber = (value) => {
    if (typeof value !== 'string') return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('+')) return trimmed
    const digits = trimmed.replace(/\D/g, '')
    return digits.length >= 8 ? `+${digits}` : trimmed
  }

  const rawDisplayNumber = [
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

  const customerName = [
    chat.customerName,
    chat.customer?.name,
    chat.customerId?.name,
    chat.contact?.name,
    chat.sender?.name,
    chat.name
  ].find((value) => value && String(value).trim())

  const displayNumber = normalizeNumber(String(rawDisplayNumber)) || customerName || 'Unknown'

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-green-50 border-l-4 border-l-whatsapp'
          : chat.unreadCount > 0
            ? 'bg-white hover:bg-gray-50 border-l-4 border-l-green-500'
            : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`font-semibold flex-1 ${chat.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
          {displayNumber}
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {formatDate(lastTime)}
        </span>
      </div>
      <p className="text-sm text-gray-600 truncate mb-2">
        {lastMessage}
      </p>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {chat.assignedTo?.name || 'Unassigned'}
        </div>
        {chat.unreadCount > 0 && (
          <span className="bg-whatsapp text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {chat.unreadCount}
          </span>
        )}
      </div>
    </div>
  )
}