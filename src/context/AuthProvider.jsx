import React, { useState, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import api from '../api/axios'

export function AuthProvider({ children }) {
  const readStoredAuth = () => {
    try {
      const savedToken = localStorage.getItem('waToken')
      const savedUser = localStorage.getItem('waUser')
      if (!savedToken || !savedUser) return { token: null, user: null, loading: false }

      return {
        token: savedToken,
        user: JSON.parse(savedUser),
        loading: false,
      }
    } catch {
      localStorage.removeItem('waToken')
      localStorage.removeItem('waUser')
      return { token: null, user: null, loading: false }
    }
  }

  const initialAuth = readStoredAuth()
  const [user, setUser] = useState(initialAuth.user)
  const [token, setToken] = useState(initialAuth.token)
  const [loading, setLoading] = useState(initialAuth.loading)

  useEffect(() => {
    const auth = readStoredAuth()
    setToken(auth.token)
    setUser(auth.user)
    setLoading(auth.loading)
  }, [])

  const login = async (identifier, password) => {
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
  }

  const loginWithToken = async (tokenParam, password) => {
    const response = await api.post('/auth/token-login', { token: tokenParam, password })
    const { token: newToken, employee: newUser } = response.data
    localStorage.setItem('waToken', newToken)
    localStorage.setItem('waUser', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return newUser
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
    <AuthContext.Provider value={{ user, token, loading, login, loginWithToken, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}