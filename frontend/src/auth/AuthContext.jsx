import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { clearStoredSession, createSession, getStoredSession, hasRole, storeSession } from './authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession())

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredSession()
      setSession(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = async (credentials) => {
    const response = await api.login(credentials)
    const nextSession = createSession(response)
    storeSession(nextSession)
    setSession(nextSession)
    return nextSession
  }

  const register = (details, registrationType) => registrationType === 'operator'
    ? api.registerOperator(details)
    : api.registerPassenger(details)

  const logout = () => {
    clearStoredSession()
    setSession(null)
  }

  return <AuthContext.Provider value={{ session, isAuthenticated: Boolean(session), login, register, logout, hasRole: (role) => hasRole(session, role) }}>
    {children}
  </AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
