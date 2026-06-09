import React from 'react'
import { NavLink } from 'react-router-dom'

// ------------------------------------------------------------------------------
// SIDEBAR COMPONENT
// ------------------------------------------------------------------------------
// Side panel navigation menu of the application.
// Lists the main pages (Dashboard, Shipments, Route Optimizer) and uses NavLink
// to dynamically append background styles to active locations.
function Sidebar() {
  // Common styling resolver for sidebar navigation elements
  const linkStyles = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white font-semibold shadow-md'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <aside className="w-56 bg-gray-800 text-white flex flex-col justify-between border-r border-gray-900">
      {/* Navigation Section Links */}
      <nav className="p-4 space-y-2 flex-1">
        {/* Dashboard Link */}
        <NavLink to="/" className={linkStyles}>
          <span role="img" aria-label="dashboard">📊</span>
          <span>Dashboard</span>
        </NavLink>

        {/* Shipments CRUD Link */}
        <NavLink to="/shipments" className={linkStyles}>
          <span role="img" aria-label="shipments">📦</span>
          <span>Shipments</span>
        </NavLink>

        {/* Route Optimizer Graph pathfinding Link */}
        <NavLink to="/routing" className={linkStyles}>
          <span role="img" aria-label="routing">🧭</span>
          <span>Route Optimizer</span>
        </NavLink>
      </nav>

      {/* Version Tag */}
      <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-500">
        SmartChain AI v1.0.0
      </div>
    </aside>
  )
}

export default Sidebar
