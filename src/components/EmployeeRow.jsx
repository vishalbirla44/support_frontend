import React, { useState } from 'react'
import { Copy, Trash2, Edit2, Key } from 'lucide-react'
import CopyLinkButton from './CopyLinkButton'

export default function EmployeeRow({
  employee,
  onEdit,
  onResetPassword,
  onDelete,
  onCopyLink
}) {
  const [showActions, setShowActions] = useState(false)

  const statusColor = employee.isOnline
    ? 'bg-green-100 text-status-online'
    : 'bg-gray-100 text-gray-700'

  const loginLink = `${window.location.origin}/login?token=${employee.loginToken || employee.tempToken || ''}`

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        {employee.name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {employee.employeeId}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <span className="capitalize">{employee.role}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`status-badge ${statusColor}`}>
          {employee.isOnline ? 'Online' : 'Offline'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {employee.messagesCount || 0}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {employee.avgResponseTime || '-'}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Actions
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <CopyLinkButton
                url={loginLink}
                label="Copy Login Link"
              />
              <button
                onClick={() => {
                  onResetPassword(employee.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Key size={16} />
                Reset Password
              </button>
              <button
                onClick={() => {
                  onEdit(employee.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Edit2 size={16} />
                Edit Name
              </button>
              <button
                onClick={() => {
                  onDelete(employee.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}