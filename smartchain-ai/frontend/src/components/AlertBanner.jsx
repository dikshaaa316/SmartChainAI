import React from 'react'

// ------------------------------------------------------------------------------
// ALERT BANNER COMPONENT
// ------------------------------------------------------------------------------
// Displays system-wide alerts in a scrolling warning banner at the top of the interface.
// Accepts:
// - alerts: An array of string warning messages
// If the alerts array is empty, this component will return null and render nothing.
function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="bg-yellow-950/30 border-b border-yellow-600/30 text-yellow-400 px-4 py-2 flex items-center z-20">
      {/* Alert Icon & Prefix */}
      <span className="mr-3 font-bold flex items-center flex-shrink-0 text-xs tracking-wider uppercase font-mono">
        <span role="img" aria-label="warning" className="mr-1">⚠️</span> 
        <span>System Alerts:</span>
      </span>

      {/* Scrolling Container */}
      <marquee className="text-sm font-medium" scrollamount="4">
        {alerts.map((alert, index) => (
          <span key={index} className="mx-6 inline-flex items-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-2"></span>
            {alert}
          </span>
        ))}
      </marquee>
    </div>
  )
}

export default AlertBanner
