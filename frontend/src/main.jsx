import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext'
import './styles.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)