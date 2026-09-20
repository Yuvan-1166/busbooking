import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { clearStoredSession, createSession, getStoredSession, hasRole, storeSession } from './authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession())

  useEffect(() => {
    // Listen for storage changes (when session is stored from another window/tab or same window)
    const handleStorageChange = () => {
      const newSession = getStoredSession()
      setSession(newSession)
    }

    // Listen for custom event when session is stored in same window
    const handleSessionStored = () => {
      const newSession = getStoredSession()
      setSession(newSession)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth:session-stored', handleSessionStored)

    // Listen for unauthorized events
    const handleUnauthorized = () => {
      clearStoredSession()
      setSession(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth:session-stored', handleSessionStored)
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const login = async (credentialsOrToken) => {
    // If it's a token string, store session directly (from TOTP verification)
    if (typeof credentialsOrToken === 'string') {
      const nextSession = createSession({ accessToken: credentialsOrToken, tokenType: 'Bearer', expiresIn: 3600 })
      storeSession(nextSession)
      setSession(nextSession)
      return nextSession
    }
    
    // If it's already a response object (has accessToken), use it directly
    // Otherwise, it's credentials - call the API
    const response = credentialsOrToken.accessToken 
      ? credentialsOrToken 
      : await api.login(credentialsOrToken)
    
    // Check if TOTP is required (response doesn't have accessToken)
    if (response.requiresTotp) {
      // Return the response for the calling code to handle navigation
      return response
    }
    
    // Normal login flow - create and store session
    const nextSession = createSession(response)
    storeSession(nextSession)
    setSession(nextSession)
    return nextSession
  }

  const register = (details, registrationType) => api.register(registrationType === 'operator' ? 'OPERATOR' : 'PASSENGER', details)

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
