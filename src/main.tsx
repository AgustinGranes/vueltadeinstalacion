import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root') || document.getElementById('app');

if (!container) {
  console.error('CRITICAL: No root or app element found in DOM!', document.body.innerHTML);
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
