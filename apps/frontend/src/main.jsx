import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile.css' // Mobile responsive styles
import './styles/mobile-fixes.css' // Additional mobile fixes
import './fixes.css' // Global fixes for font overlap and z-index issues
import './styles/navbar-fixes.css' // Navbar layout and font fixes
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './i18n/config' // Initialize i18n
import { registerServiceWorker } from './utils/pwaUtils'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// Register Service Worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker()
}
