import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import PropuestaIndigoPage from './pages/PropuestaIndigoPage.tsx'
import './index.css'
import { initTheme } from './hooks/useTheme'
import { IamProvider } from './context/IamContext'

initTheme()

// Rutas estáticas: /propuesta → landing page propuesta Índigo
const path = window.location.pathname.replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/propuesta' ? (
      <PropuestaIndigoPage />
    ) : (
      <IamProvider>
        <App />
      </IamProvider>
    )}
  </React.StrictMode>,
)
