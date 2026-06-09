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

function LiveMap({ shipments = [] }) {
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

    // Clear existing markers
    mapInstanceRef.current.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer)
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

    return () => {}
  }, [shipments])

  return (
    <div
      ref={mapRef}
      style={{ height: '450px', width: '100%', borderRadius: '12px' }}
    />
  )
}

export default LiveMap