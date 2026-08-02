import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// Only exports a hook — no components, no raw context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}