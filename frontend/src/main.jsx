import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AuthPage from './auth/AuthPage'
import './styles.css'

function Root() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <App /> : <AuthPage />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)