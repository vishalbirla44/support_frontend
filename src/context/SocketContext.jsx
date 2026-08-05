import React, { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

export const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const { token, user } = useAuth()

  useEffect(() => {
    if (!token || !user) {
      // Disconnect if logged out
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    // Connect with JWT in handshake auth
    const newSocket = io(import.meta.env.VITE_API_URL || 'https://support-backend-jer2.onrender.com', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id)

      // ✅ Send 'authenticate' — matches socketHandler.js
      newSocket.emit('authenticate', { token })
    })

    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data)
    })

    newSocket.on('auth_error', (error) => {
      console.error('❌ Socket auth error:', error)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [token, user])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = React.useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}