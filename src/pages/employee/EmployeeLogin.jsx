import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { MessageSquare, AlertCircle, Loader } from 'lucide-react'

export default function EmployeeLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, loginWithToken, user, isAdmin, loading: authLoading } = useAuth()

  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const tokenFromUrl = searchParams.get('token')

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const target = user.role === 'admin' ? '/admin' : '/inbox'
      navigate(target, { replace: true })
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authenticatedUser = tokenFromUrl
        ? await loginWithToken(tokenFromUrl, password)
        : await login(employeeId, password)

      if (authenticatedUser) {
        navigate(authenticatedUser.role === 'admin' ? '/admin' : '/inbox')
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8 shadow-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-whatsapp rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Support Hub</h1>
            <p className="text-sm text-gray-600 mt-1">Tech Rudraum Pvt. Ltd.</p>
            <p className="text-xs text-gray-500 mt-2">WhatsApp Support Platform</p>
          </div>

          {/* Token Message */}
          {tokenFromUrl && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                Login link detected — enter your password to continue
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!tokenFromUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID or Email
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID or email"
                  className="input-field"
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader size={20} className="animate-spin" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 mt-6">
            This is a secure WhatsApp support platform.<br />
            Only authorized employees can access.
          </p>
          <p className="text-center text-xs text-gray-500 mt-4">
            Developed by Vishal Birla
          </p>
        </div>
      </div>
    </div>
  )
}