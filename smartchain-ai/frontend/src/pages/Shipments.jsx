import React, { useState, useEffect } from 'react'
import api from '../services/api'

// ------------------------------------------------------------------------------
// SHIPMENTS MANAGEMENT PAGE COMPONENT
// ------------------------------------------------------------------------------
// Performs full CRUD operations on Shipments:
// - Reads list from GET /shipments/
// - Creates shipment via POST /shipments/
// - Updates shipment parameters via PUT /shipments/{id}
// - Deletes shipment via DELETE /shipments/{id}
// Implements form state toggle between "Register" and "Edit" modes.
function Shipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // React state hook for form fields mapping to ShipmentCreate schema
  const [form, setForm] = useState({
    source: '',
    destination: '',
    current_lat: '',
    current_lng: '',
    distance: ''
  })

  // Tracker for determining if form is in edit mode (stores active shipment ID, or null)
  const [editingId, setEditingId] = useState(null)

  // Fetch all shipments from backend
  const fetchShipmentsList = async () => {
    try {
      setLoading(true)
      const response = await api.get('/shipments/')
      setShipments(response.data)
      setError(null)
    } catch (err) {
      console.error("Failed to query shipments database list:", err)
      setError("Failed to fetch shipments. Verify that the backend service is running.")
    } finally {
      setLoading(false)
    }
  }

  // Load shipment rows on initial component mount
  useEffect(() => {
    fetchShipmentsList()
  }, [])

  // Input change handler matching fields to state keys
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle addition or update submission
  const handleSubmitForm = async (e) => {
    e.preventDefault()

    // Form inputs submit string types by default. Cast numerical values before posting.
    const payload = {
      source: form.source,
      destination: form.destination,
      current_lat: parseFloat(form.current_lat),
      current_lng: parseFloat(form.current_lng),
      distance: parseFloat(form.distance)
    }

    try {
      if (editingId) {
        // Edit mode: Run PUT request to update shipment record
        await api.put(`/shipments/${editingId}`, payload)
        setEditingId(null)
      } else {
        // Add mode: Run POST request to append new shipment record
        await api.post('/shipments/', payload)
      }

      // Reset form controls
      setForm({
        source: '',
        destination: '',
        current_lat: '',
        current_lng: '',
        current_lng: '',
        distance: ''
      })

      // Refresh list
      await fetchShipmentsList()
    } catch (err) {
      console.error("Failed to submit shipment payload:", err)
      alert("Submission error. Ensure that the coordinates and distance are valid numbers.")
    }
  }

  // Edit action trigger: loads shipment data to input fields and flags Edit Mode
  const handleEditInit = (shipment) => {
    setEditingId(shipment.id)
    setForm({
      source: shipment.source,
      destination: shipment.destination,
      current_lat: shipment.current_lat,
      current_lng: shipment.current_lng,
      distance: shipment.distance
    })
  }

  // Cancel editing operation and reset form inputs back to default
  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({
      source: '',
      destination: '',
      current_lat: '',
      current_lng: '',
      current_lng: '',
      distance: ''
    })
  }

  // Delete action trigger: queries user confirm, and deletes row
  const handleDeleteTrigger = async (id) => {
    if (window.confirm("Are you sure you want to delete this shipment?")) {
      try {
        await api.delete(`/shipments/${id}`)
        await fetchShipmentsList()
      } catch (err) {
        console.error("Failed to delete shipment:", err)
        alert("Deletion failed. Please try again.")
      }
    }
  }

  // Status styling resolver matching status to color codes
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            Delivered
          </span>
        )
      case 'Pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Pending
          </span>
        )
      case 'In Transit':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            In Transit
          </span>
        )
    }
  }

  // ETA Renderer logic
  const renderCurrentEta = (shipment) => {
    // Attempt parsing as ISO date or valid date string
    const orig = new Date(shipment.original_eta)
    const curr = new Date(shipment.current_eta)
    
    // Check if parsing succeeded and current is later than original
    if (!isNaN(orig) && !isNaN(curr) && curr > orig) {
      return (
        <span className="text-red-400 font-semibold flex items-center gap-1">
          {shipment.current_eta}
          <span className="text-xs bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30">⚠ Delayed</span>
        </span>
      )
    }
    
    // Otherwise return as green
    return <span className="text-green-400 font-semibold">{shipment.current_eta || shipment.eta}</span>
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Shipment Management</h1>
        <p className="text-gray-400 text-sm mt-1">Add, update, search, and delete active shipments.</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Shipment Records Grid Card */}
      <div className="bg-gray-850 border border-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <h2 className="font-semibold text-white">Active Shipments</h2>
          <button 
            onClick={fetchShipmentsList}
            className="text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-all"
          >
            Refresh Table
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No shipments logged yet. Register one below.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800/40 text-xs font-semibold uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Distance (km)</th>
                  <th className="px-6 py-4">Original ETA</th>
                  <th className="px-6 py-4">Current ETA</th>
                  <th className="px-6 py-4">Delay %</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-800/35 transition-all">
                    <td className="px-6 py-4 font-mono font-bold text-gray-500">{shipment.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{shipment.source}</td>
                    <td className="px-6 py-4 text-gray-300">{shipment.destination}</td>
                    <td className="px-6 py-4">{renderStatusBadge(shipment.status)}</td>
                    <td className="px-6 py-4 font-mono">{shipment.distance}</td>
                    <td className="px-6 py-4 text-gray-400">{shipment.original_eta || shipment.eta}</td>
                    <td className="px-6 py-4">{renderCurrentEta(shipment)}</td>
                    <td className="px-6 py-4 font-mono text-yellow-450 text-yellow-400 font-semibold">
                      {(shipment.delay_probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditInit(shipment)}
                        className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded text-xs transition-all border border-blue-500/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTrigger(shipment.id)}
                        className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-xs transition-all border border-red-500/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation and Modification Form Panel Card */}
      <div className="bg-gray-800 border border-gray-700/60 rounded-lg p-6 shadow-md max-w-3xl">
        <h2 className="text-lg font-bold text-white mb-2">
          {editingId ? '✏️ Edit Shipment' : '➕ Add New Shipment'}
        </h2>
        <p className="text-gray-400 text-xs mb-6">
          {editingId ? 'Modify route parameters. Updating returns state back to insertion mode.' : 'Input shipping logistics coordinates to compute routing paths.'}
        </p>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Source</label>
              <input
                type="text"
                name="source"
                required
                value={form.source}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Origin location name"
              />
            </div>

            {/* Destination Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Destination</label>
              <input
                type="text"
                name="destination"
                required
                value={form.destination}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Target location name"
              />
            </div>

            {/* Current Latitude Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Lat</label>
              <input
                type="number"
                step="any"
                name="current_lat"
                required
                value={form.current_lat}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="e.g. 34.0522"
              />
            </div>

            {/* Current Longitude Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Lng</label>
              <input
                type="number"
                step="any"
                name="current_lng"
                required
                value={form.current_lng}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="e.g. -118.2437"
              />
            </div>

            {/* Distance Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Distance (km)</label>
              <input
                type="number"
                step="any"
                name="distance"
                required
                value={form.distance}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Travel distance"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded shadow transition-all"
            >
              {editingId ? 'Update Shipment' : 'Add Shipment'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold text-sm px-5 py-2.5 rounded transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Shipments
