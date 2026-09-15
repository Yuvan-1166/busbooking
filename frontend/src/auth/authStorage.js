const SESSION_KEY = 'busbooking.auth'
const REGISTERED_USER_KEY = 'busbooking.registeredUser'

function decodePayload(token) {
  const payload = token.split('.')[1]
  if (!payload) throw new Error('Invalid access token.')
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=')))
}

export function createSession(response) {
  const claims = decodePayload(response.accessToken)
  const roles = String(claims.roles || '').split(',').map((role) => role.trim()).filter(Boolean)
  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType || 'Bearer',
    expiresIn: response.expiresIn,
    email: claims.sub,
    roles,
    expiresAt: claims.exp ? claims.exp * 1000 : Date.now() + response.expiresIn * 1000,
  }
}

export function getStoredSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (!session || session.expiresAt <= Date.now()) {
      clearStoredSession()
      return null
    }
    return session
  } catch {
    clearStoredSession()
    return null
  }
}

export function storeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function rememberRegisteredUser(user) {
  localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(user))
}

export function hasRole(session, role) {
  return Boolean(session?.roles?.includes(`ROLE_${role}`) || session?.roles?.includes(role))
}
