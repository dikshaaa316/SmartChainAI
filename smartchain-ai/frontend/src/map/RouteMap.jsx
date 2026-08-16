import React from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// ------------------------------------------------------------------------------
// LEAFLET ICON FIX
// ------------------------------------------------------------------------------
// Fix marker icon bug with webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ------------------------------------------------------------------------------
// ROUTE MAP COMPONENT
// ------------------------------------------------------------------------------
// Renders a leaflet map displaying a polyline route between a set of coordinates.
function RouteMap({ routeCoordinates = [] }) {
  // Center on midpoint of the route, or center of India if no coordinates
  const center = routeCoordinates.length > 0 
    ? [
        (routeCoordinates[0][0] + routeCoordinates[routeCoordinates.length - 1][0]) / 2,
        (routeCoordinates[0][1] + routeCoordinates[routeCoordinates.length - 1][1]) / 2
      ]
    : [20.5937, 78.9629]

  return (
    <div className="h-[350px] w-full rounded-lg overflow-hidden border border-gray-700 shadow-sm mt-6">
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw the route line if there are at least 2 points */}
        {routeCoordinates.length >= 2 && (
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: '#3b82f6', weight: 4 }} 
          />
        )}

        {/* Place a Marker at the first coordinate with Popup "Start" */}
        {routeCoordinates.length > 0 && (
          <Marker position={routeCoordinates[0]}>
            <Popup>Start</Popup>
          </Marker>
        )}

        {/* Place a Marker at the last coordinate with Popup "Destination" */}
        {routeCoordinates.length > 1 && (
          <Marker position={routeCoordinates[routeCoordinates.length - 1]}>
            <Popup>Destination</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default RouteMap
