import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile.css' // Mobile responsive styles
import './styles/mobile-fixes.css' // Additional mobile fixes
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './i18n/config' // Initialize i18n

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
