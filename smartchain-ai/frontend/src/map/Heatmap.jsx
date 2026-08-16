import React from 'react'
import { Circle, Popup } from 'react-leaflet'

// ------------------------------------------------------------------------------
// HEATMAP COMPONENT
// ------------------------------------------------------------------------------
// Renders risk intensity circles on the map.
// Colors: Green (low risk), Yellow (medium risk), Red (high risk).
function Heatmap({ regions = [] }) {
  return (
    <>
      {regions.map((region, idx) => {
        // Color logic based on risk score
        let color = '#22c55e' // Green
        let fillOpacity = 0.3
        
        if (region.risk_score > 70) {
          color = '#ef4444' // Red
          fillOpacity = 0.4
        } else if (region.risk_score >= 40) {
          color = '#eab308' // Yellow
          fillOpacity = 0.35
        }

        return (
          <Circle
            key={`heatmap-circle-${idx}`}
            center={[region.latitude, region.longitude]}
            radius={50000}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: fillOpacity,
              weight: 0 // Optional: removing border line, just keeping the fill
            }}
          >
            <Popup>
              <div className="font-sans text-gray-800">
                <strong className="block text-lg mb-1">{region.region_name}</strong>
                <span>Risk Score: {region.risk_score.toFixed(1)}</span>
              </div>
            </Popup>
          </Circle>
        )
      })}
    </>
  )
}

export default Heatmap
