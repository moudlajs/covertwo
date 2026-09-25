import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerServiceWorker } from './lib/offline'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing from index.html')

// Offline support (#53). Production only, so dev never serves stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) registerServiceWorker()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
