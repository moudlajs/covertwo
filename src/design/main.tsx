// Reference render of the chosen design (variant D) until the M1 app shell
// (#21) and game row (#22) implement it; delete src/design/ and design/ then.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import D from './variant-d'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <D />
  </StrictMode>,
)
