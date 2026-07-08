import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initTheme } from './hooks/useTheme'
import { IamProvider } from './context/IamContext'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IamProvider>
      <App />
    </IamProvider>
  </React.StrictMode>,
)
