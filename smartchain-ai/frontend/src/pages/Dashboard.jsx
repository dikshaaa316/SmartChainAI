import React, { useState, useEffect } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'
import LiveMap from '../map/LiveMap'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

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
  const [regions, setRegions] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all shipments and regions from the backend API on component mount
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true)
        const shipmentsResponse = await api.get('/shipments/')
        setShipments(shipmentsResponse.data)

        // Fetch regions
        let regionsResponse = await api.get('/analytics/regions/')
        if (regionsResponse.data.length === 0) {
          try {
            await api.post('/analytics/regions/seed')
            regionsResponse = await api.get('/analytics/regions/')
          } catch (seedErr) {
            console.error("Failed to seed regions, proceeding with empty list:", seedErr)
          }
        }
        setRegions(regionsResponse.data)
        setError(null)
      } catch (err) {
        console.error("Dashboard failed to retrieve metrics:", err)
        setError("Error loading metrics dashboard. Check backend availability.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardMetrics()
  }, [])

  // Fetch all warehouses capacity metrics from the backend on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        let response = await api.get('/analytics/warehouses/')
        if (response.data.length === 0) {
          try {
            await api.post('/analytics/warehouses/seed')
            response = await api.get('/analytics/warehouses/')
          } catch (seedErr) {
            console.error("Failed to seed warehouses, proceeding with empty list:", seedErr)
          }
        }
        setWarehouses(response.data)
      } catch (err) {
        console.error("Dashboard failed to retrieve warehouse metrics:", err)
      }
    }

    fetchWarehouses()
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
        {/* Live Leaflet Map */}
        <LiveMap shipments={shipments} regions={regions} />

        {/* Recharts Analytics: Warehouse Utilization BarChart */}
        <div className="bg-gray-850 border border-gray-800 rounded-lg p-6 shadow-sm flex flex-col min-h-[350px]">
          <h2 className="text-lg font-bold text-white mb-4">Warehouse Utilization %</h2>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={warehouses} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="warehouse_name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Utilization']}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
                  {warehouses.map((entry, index) => {
                    let color = '#10B981' // Green (< 60)
                    if (entry.utilization > 90) {
                      color = '#EF4444' // Red (> 90)
                    } else if (entry.utilization >= 60) {
                      color = '#F59E0B' // Yellow (60-90)
                    }
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Bar>
                <ReferenceLine 
                  y={90} 
                  stroke="#EF4444" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Critical', fill: '#EF4444', position: 'top', fontSize: 12 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


