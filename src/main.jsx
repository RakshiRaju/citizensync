import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/style.css' // Import the global styles we copied from the Flask template
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
