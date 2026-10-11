import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/app.scss'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
