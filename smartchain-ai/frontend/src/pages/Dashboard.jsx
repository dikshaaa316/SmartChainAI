import React, { useState, useEffect } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'
import AlertBanner from '../components/AlertBanner'
import LiveMap from '../map/LiveMap'
import Heatmap from '../map/Heatmap'
import { connectWebSocket } from '../services/websocket'
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
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsStatus, setWsStatus] = useState('connecting')

  // Replaced multiple interval polling useEffects with a single initial load + WS subscription
  useEffect(() => {
    let wsCleanup = null

    const initialFetch = async () => {
      try {
        setLoading(true)
        // Fire initial requests concurrently for faster first paint
        const [shipmentsRes, alertsRes] = await Promise.all([
          api.get('/shipments/'),
          api.get('/analytics/alerts/')
        ])
        setShipments(shipmentsRes.data)
        setAlerts(alertsRes.data)

        // Seed regions if empty
        let regionsRes = await api.get('/analytics/regions')
        if (regionsRes.data.length === 0) {
          try {
            await api.post('/analytics/regions/seed')
            regionsRes = await api.get('/analytics/regions')
          } catch (e) { }
        }
        setRegions(regionsRes.data)

        // Seed warehouses if empty
        let whRes = await api.get('/analytics/warehouses')
        if (whRes.data.length === 0) {
          try {
            await api.post('/analytics/warehouses/seed')
            whRes = await api.get('/analytics/warehouses')
          } catch (e) { }
        }
        setWarehouses(whRes.data)
        
        setError(null)
      } catch (err) {
        console.error("Dashboard initial fetch failed:", err)
        setError("Error loading metrics dashboard. Check backend availability.")
      } finally {
        setLoading(false)
      }

      // 2. Establish WebSocket connection after initial data is rendered
      wsCleanup = connectWebSocket(
        (data) => {
          if (data.type === 'update') {
            if (data.shipments) setShipments(data.shipments)
            if (data.alerts) setAlerts(data.alerts)
            if (data.warehouses) setWarehouses(data.warehouses)
          }
        },
        (status) => {
          setWsStatus(status)
        }
      )
    }

    initialFetch()

    // Clean up WS connection on manual unmount
    return () => {
      if (wsCleanup) wsCleanup()
    }
  }, [])

  // Calculate live statistics from the fetched list
  const totalCount = shipments.length
  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length
  const delayedCount = shipments.filter(s => s.delay_probability > 0.5).length
  
  // Calculate average delay probability as a rounded percentage
  const avgRiskPercent = totalCount > 0 
    ? (shipments.reduce((sum, item) => sum + item.delay_probability, 0) / totalCount * 100).toFixed(1)
    : "0.0"

  // Calculate Avg ETA Delay
  let totalDelayMinutes = 0;
  let validDelayCount = 0;
  shipments.forEach(s => {
    const orig = new Date(s.original_eta)
    const curr = new Date(s.current_eta)
    if (!isNaN(orig) && !isNaN(curr)) {
       const diffMins = (curr - orig) / 60000;
       if (diffMins > 0) {
         totalDelayMinutes += diffMins;
       }
       validDelayCount++;
    }
  })
  const avgEtaDelay = validDelayCount > 0 ? (totalDelayMinutes / validDelayCount).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Dashboard Heading Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Dashboard Overview
            {/* 
              WS Status Indicator
              Placed here because we are instructed not to modify Navbar.jsx to accept props. 
            */}
            <div className={`flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${
              wsStatus === 'connected' ? 'bg-green-950/40 border-green-700/50 text-green-400' : 'bg-red-950/40 border-red-700/50 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${wsStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {wsStatus === 'connected' ? '🟢 Live' : '🔴 Reconnecting...'}
            </div>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time analytics and predictive routing metrics.</p>
        </div>
      </div>

      {/* Error Banner Container */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Dynamic Alerts Banner rendered here if not globally handled */}
      <AlertBanner alerts={alerts} />

      {/* Stats Cards Section Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
        <StatCard 
          title="Avg ETA Delay" 
          value={loading ? "..." : `${avgEtaDelay} min`} 
          color="border-purple-500" 
        />
      </div>

      {/* Main Grid: Map and Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Leaflet Map */}
        <div className="flex flex-col gap-4">
          <LiveMap shipments={shipments} regions={regions}>
            <Heatmap regions={regions} />
          </LiveMap>
          
          {/* Heatmap Legend */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
              <span className="text-sm text-gray-300">Low Risk (&lt;40)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#eab308]"></span>
              <span className="text-sm text-gray-300">Medium Risk (40-70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
              <span className="text-sm text-gray-300">High Risk (&gt;70)</span>
            </div>
          </div>
        </div>

        {/* Recharts Analytics: Warehouse Utilization BarChart */}
        <div className="bg-gray-850 border border-gray-800 rounded-lg p-6 shadow-sm flex flex-col min-h-[350px]">
          <h2 className="text-lg font-bold text-white mb-4">Warehouse Utilization %</h2>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height={250}>
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
                    let color = '#22c55e' // Green (< 70)
                    if (entry.utilization > 90) {
                      color = '#ef4444' // Red (> 90)
                    } else if (entry.utilization >= 70) {
                      color = '#eab308' // Yellow (70-90)
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


