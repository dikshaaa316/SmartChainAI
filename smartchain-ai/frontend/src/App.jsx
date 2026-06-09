import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AlertBanner from './components/AlertBanner'
import Dashboard from './pages/Dashboard'
import Shipments from './pages/Shipments'
import Routing from './pages/Routing'

// ------------------------------------------------------------------------------
// APP COMPONENT (CORE ROUTING & LAYOUT)
// ------------------------------------------------------------------------------
// Renders the global layout consisting of:
// - Navbar: Sticky top navigation
// - AlertBanner: Horizontal marquee with warning updates
// - Sidebar: Sticky left sidebar menu
// - Main Content Area: Responsive container displaying active route pages
function App() {
  // Demo alerts list passed to the scrolling banner. Can be expanded in future steps.
  const [alerts] = useState([
    "Customs processing slowdown at Eastern Port - delays predicted up to 3 hours.",
    "Heavy rain warning moving through Central Region - routing engine suggesting detour options."
  ])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 text-gray-100 font-sans">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Scrolling Warning Alerts Banner */}
      <AlertBanner alerts={alerts} />

      {/* Main Content Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left-hand Sidebar Navigation */}
        <Sidebar />

        {/* Scrollable Main Content panel */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
          <Routes>
            {/* Map root paths to matching Page view components */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/routing" element={<Routing />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
