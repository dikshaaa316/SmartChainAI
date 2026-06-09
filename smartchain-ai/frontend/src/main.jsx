import './index.css'
import React from 'react'
import './index.css'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// ------------------------------------------------------------------------------
// FRONTEND ENTRY POINT
// ------------------------------------------------------------------------------
// Mount the React application to the root div of index.html.
// Wraps <App /> with <BrowserRouter> to enable routing capabilities across pages.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
