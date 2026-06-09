import React from 'react'

// ------------------------------------------------------------------------------
// NAVBAR COMPONENT
// ------------------------------------------------------------------------------
// Top navigation header featuring:
// - Title with chain emoji (🔗 SmartChain AI)
// - Pulse indicator confirming active "Live" API websocket connection status
function Navbar() {
  return (
    <header className="bg-gray-900 text-white border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10 shadow-md">
      {/* Brand Title */}
      <div className="flex items-center space-x-2 text-xl font-bold tracking-wide">
        <span role="img" aria-label="chain">🔗</span>
        <span>SmartChain AI</span>
      </div>

      {/* Real-time Connection Status Dot */}
      <div className="flex items-center bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800 text-xs font-semibold text-gray-300">
        <span className="relative flex h-2.5 w-2.5 mr-2">
          {/* Inner pulsing circle */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          {/* Static core dot */}
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span>Live</span>
      </div>
    </header>
  )
}

export default Navbar
