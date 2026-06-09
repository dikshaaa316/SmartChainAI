import React, { useState, useEffect } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'

// ------------------------------------------------------------------------------
// DASHBOARD PAGE COMPONENT
// ------------------------------------------------------------------------------
// Renders key statistics and placeholders for widgets (maps and analytics charts).
// Pulls all active shipments on load to evaluate:
// - Total count
// - Active in-transit shipment count
// - High-risk/delayed count (delay probability > 50%)
// - Aggregate delay risk probability percentage
function Dashboard() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all shipments from the backend API on component mount
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true)
        const response = await api.get('/shipments/')
        setShipments(response.data)
        setError(null)
      } catch (err) {
        console.error("Dashboard failed to retrieve shipment metrics:", err)
        setError("Error loading metrics dashboard. Check backend availability.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardMetrics()
  }, [])

  // Calculate live statistics from the fetched list
  const totalCount = shipments.length
  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length
  const delayedCount = shipments.filter(s => s.delay_probability > 0.5).length
  
  // Calculate average delay probability as a rounded percentage
  const avgRiskPercent = totalCount > 0 
    ? (shipments.reduce((sum, item) => sum + item.delay_probability, 0) / totalCount * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6">
      {/* Dashboard Heading Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time analytics and predictive routing metrics.</p>
      </div>

      {/* Error Banner Container */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards Section Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Shipments" 
          value={loading ? "..." : totalCount} 
          color="border-blue-500" 
        />
        <StatCard 
          title="In Transit" 
          value={loading ? "..." : inTransitCount} 
          color="border-amber-500" 
        />
        <StatCard 
          title="Delayed" 
          value={loading ? "..." : delayedCount} 
          color="border-red-500" 
        />
        <StatCard 
          title="Avg Risk" 
          value={loading ? "..." : `${avgRiskPercent}%`} 
          color="border-yellow-500" 
        />
      </div>

      {/* Main Grid: Map and Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Map Visual Mock */}
        <div className="bg-gray-850 border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-[350px] shadow-sm">
          <span className="text-5xl mb-4" role="img" aria-label="map">🗺️</span>
          <h2 className="text-lg font-bold text-white">Map Coming in Next Step</h2>
          <p className="text-gray-400 text-sm max-w-xs mt-2">
            Dynamic Leaflet mapping representing global transit paths, warehouses, and vehicle trackers.
          </p>
        </div>

        {/* Recharts Analytics Mock */}
        <div className="bg-gray-850 border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-[350px] shadow-sm">
          <span className="text-5xl mb-4" role="img" aria-label="charts">📊</span>
          <h2 className="text-lg font-bold text-white">Charts Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-xs mt-2">
            Recharts analytics representing delays over time, risk indexes, and transit metrics.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
