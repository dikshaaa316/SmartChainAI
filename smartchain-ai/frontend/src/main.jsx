import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// ------------------------------------------------------------------------------
// FRONTEND ENTRY POINT
// ------------------------------------------------------------------------------
// Mount the React application to the root div of index.html.
// Wraps <App /> with <BrowserRouter> to enable routing capabilities across pages.
// React.StrictMode is explicitly removed here to prevent react-leaflet map initialization crashes
// caused by React 18's double-mounting behavior in development mode.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
