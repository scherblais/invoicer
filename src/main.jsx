import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { isDemo } from './config'
import './styles.css'

// HashRouter in the demo so deep links / refreshes work on GitHub Pages
// (a static host with no SPA rewrite). The real app uses clean URLs.
const Router = isDemo ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
)
