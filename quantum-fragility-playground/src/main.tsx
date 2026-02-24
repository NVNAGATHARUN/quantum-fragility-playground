import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { GuidedTourProvider } from './providers/GuidedTourProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GuidedTourProvider>
        <App />
      </GuidedTourProvider>
    </BrowserRouter>
  </React.StrictMode>
)
