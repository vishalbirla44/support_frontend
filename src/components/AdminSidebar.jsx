import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Users, MessageSquare, Phone, Settings, LogOut } from 'lucide-react'

export default function AdminSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const links = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/employees', label: 'Employees', icon: Users },
    { path: '/admin/numbers', label: 'WhatsApp Numbers', icon: MessageSquare },
    { path: '/admin/chats', label: 'All Chats', icon: MessageSquare },
    { path: '/admin/autoreplies', label: 'Auto-Replies', icon: Settings },
    { path: '/admin/call-logs', label: 'Call Logs', icon: Phone }
  ]

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside className="w-64 bg-sidebar text-white h-screen flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-sidebar-light">
        <h1 className="text-2xl font-bold text-whatsapp">Support Hub</h1>
        <p className="text-sm text-gray-400 mt-1">Tech Rudraum Pvt. Ltd.</p>
        <p className="text-xs text-gray-500 mt-2">WhatsApp Management</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6">
        <div className="space-y-1 px-4">
          {links.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(path)
                  ? 'bg-whatsapp text-white shadow-lg'
                  : 'text-gray-300 hover:bg-sidebar-light'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-light p-4">
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Logged in as</p>
          <p className="font-semibold text-white truncate">{user?.name || 'Admin'}</p>
          <p className="text-xs text-gray-500">{user?.employeeId}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}