import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/source-sans-3'
import '@fontsource-variable/unbounded'
import '@fontsource-variable/jetbrains-mono'
import './design-system/css/tokens.css'
import './design-system/css/components.css'
import './design-system/css/layouts.css'
import './design-system/css/icc.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
