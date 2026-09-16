import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AuthPage from './auth/AuthPage'
import './styles.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function Root() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <App /> : <AuthPage />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <Root />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)