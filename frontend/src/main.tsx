import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setupI18n } from '@/lib/i18n'
import App from './app/App'

setupI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
