import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing from index.html')

// Offline support (#53). Production only, so dev never serves stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.error('[sw] registration failed', error)
    })
  })
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
