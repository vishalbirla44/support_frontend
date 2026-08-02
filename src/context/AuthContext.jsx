import React, { createContext, useState, useEffect } from 'react'
import api from '../api/axios'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('waUser')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('waToken') || null)
  const [loading, setLoading] = useState(true)

  // Initialize auth on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('waToken')
      const savedUser = localStorage.getItem('waUser')

      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } else {
        setToken(null)
        setUser(null)
      }
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (identifier, password) => {
    try {
      const body = { password }
      if (identifier?.includes('@')) {
        body.email = identifier
      } else {
        body.employeeId = identifier
      }

      const response = await api.post('/auth/employee/login', body)
      const { token: newToken, employee: newUser } = response.data

      localStorage.setItem('waToken', newToken)
      localStorage.setItem('waUser', JSON.stringify(newUser))

      setToken(newToken)
      setUser(newUser)

      return newUser
    } catch (error) {
      throw error
    }
  }

  const loginWithToken = async (tokenParam, password) => {
    try {
      const response = await api.post('/auth/token-login', {
        token: tokenParam,
        password
      })
      
      const { token: newToken, employee: newUser } = response.data
      
      localStorage.setItem('waToken', newToken)
      localStorage.setItem('waUser', JSON.stringify(newUser))
      
      setToken(newToken)
      setUser(newUser)
      
      return newUser
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('waToken')
      localStorage.removeItem('waUser')
      setToken(null)
      setUser(null)
      window.location.href = '/login'
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithToken,
      logout,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}