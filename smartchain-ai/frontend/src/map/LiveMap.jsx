import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix marker icon bug
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CITY_COORDINATES = {
  "Delhi NCR": [28.6139, 77.2090],
  "Mumbai": [19.0760, 72.8777],
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Bengaluru": [12.9716, 77.5946],
  "Hyderabad": [17.3850, 78.4867]
}

const getRiskColor = (score) => {
  if (score < 40) return '#10B981' // Green (Emerald)
  if (score <= 70) return '#FBBF24' // Yellow (Amber)
  return '#EF4444' // Red (Rose)
}

const getRiskLevel = (score) => {
  if (score < 40) return 'Low'
  if (score <= 70) return 'Medium'
  return 'High'
}

function LiveMap({ shipments = [], regions = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    // Initialize map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current)
    }

    // Clear existing markers and circles
    mapInstanceRef.current.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Add risk circles first so shipment markers render on top
    regions.forEach(region => {
      const coords = CITY_COORDINATES[region.region_name]
      if (coords) {
        const color = getRiskColor(region.risk_score)
        const level = getRiskLevel(region.risk_score)
        L.circle(coords, {
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          radius: 150000, // ~150km in meters
          weight: 1.5
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family: sans-serif; color: #1F2937;">
              <strong style="font-size: 1.1em; display: block; margin-bottom: 4px; color: #111827;">${region.region_name}</strong>
              <span style="color: #4B5563; font-size: 0.9em;">Traffic Score: ${region.traffic_score}</span><br/>
              <span style="color: #4B5563; font-size: 0.9em;">Weather Score: ${region.weather_score}</span><br/>
              <span style="color: #4B5563; font-size: 0.9em;">Warehouse Score: ${region.warehouse_score}</span><br/>
              <hr style="margin: 6px 0; border: none; border-top: 1px solid #E5E7EB;"/>
              <strong>Risk Score:</strong> ${region.risk_score.toFixed(1)}<br/>
              <strong>Risk Level:</strong> <span style="color: ${color}; font-weight: bold;">${level}</span>
            </div>
          `)
      }
    })

    // Add shipment markers
    shipments
      .filter(s => s.current_lat && s.current_lng)
      .forEach(s => {
        L.marker([s.current_lat, s.current_lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <strong>Shipment #${s.id}</strong><br/>
            ${s.source} → ${s.destination}<br/>
            Status: ${s.status}<br/>
            ETA: ${s.eta}
          `)
      })

    return () => { }
  }, [shipments, regions])

  return (
    <div className="flex flex-col h-full space-y-4">
      <div
        ref={mapRef}
        style={{ height: '450px', width: '100%', borderRadius: '12px' }}
      />
      
      {/* Risk Legend Card */}
      <div className="bg-gray-850 border border-gray-800 rounded-lg p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Region Risk Legend</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-400/20 shadow-sm shadow-emerald-500/20" />
            <span className="text-gray-300 font-medium">Low Risk (&lt; 40)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-400/20 shadow-sm shadow-amber-500/20" />
            <span className="text-gray-300 font-medium">Medium Risk (40-70)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-400/20 shadow-sm shadow-rose-500/20" />
            <span className="text-gray-300 font-medium">High Risk (&gt; 70)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMap