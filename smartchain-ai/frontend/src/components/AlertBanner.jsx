import React from 'react'

// ------------------------------------------------------------------------------
// ALERT BANNER COMPONENT
// ------------------------------------------------------------------------------
// Displays system-wide alerts in a CSS-animated scrolling ticker.
// Accepts:
// - alerts: An array of alert objects { message, severity }
// If the alerts array is empty, this component will return null and render nothing.
function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="bg-gray-950 border-b border-gray-800 text-gray-200 py-2.5 flex items-center z-20 overflow-hidden relative w-full">
      {/* Inline styles for the ticker animation */}
      <style>
        {`
          @keyframes ticker-scroll {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
          .animate-ticker {
            display: inline-flex;
            white-space: nowrap;
            /* Adjust speed based on number of alerts to maintain readability, base 20s */
            animation: ticker-scroll 25s linear infinite;
            padding-right: 100vw; /* ensure it scrolls fully off screen */
          }
          .animate-ticker:hover {
            animation-play-state: paused;
          }
        `}
      </style>
      
      {/* Alert Icon & Prefix - pinned to the left */}
      <div className="pl-4 pr-3 font-bold flex items-center flex-shrink-0 text-xs tracking-wider uppercase font-mono z-10 bg-gray-950 shadow-[10px_0_15px_rgba(3,7,18,1)]">
        <span role="img" aria-label="warning" className="mr-1.5 text-yellow-500">📡</span> 
        <span className="text-gray-400">Live Alerts:</span>
      </div>

      {/* Scrolling Container */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="animate-ticker space-x-4">
          {alerts.map((alert, index) => {
            const severity = alert.severity || 'Medium'
            const msg = alert.message || alert
            
            // Define styles and icons based on severity
            let bgClass = "bg-gray-800 border-gray-700 text-gray-300"
            let icon = "ℹ"
            
            if (severity === 'High') {
              bgClass = "bg-red-900/60 border-red-600/50 text-red-200"
              icon = "⚠"
            } else if (severity === 'Medium') {
              bgClass = "bg-yellow-900/60 border-yellow-600/50 text-yellow-200"
              icon = "⚠"
            } else if (severity === 'Low') {
              bgClass = "bg-blue-900/60 border-blue-600/50 text-blue-200"
              icon = "ℹ"
            }

            return (
              <div 
                key={index} 
                className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap shadow-sm transition-transform hover:scale-105 cursor-default ${bgClass}`}
              >
                <span className="mr-1.5 opacity-90">{icon}</span>
                {msg}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AlertBanner
