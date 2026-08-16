import React, { useState } from 'react'
import api from '../services/api'
import RouteMap from '../map/RouteMap'

// ------------------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------------------
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"];

// Hardcoded city coordinates for map plotting
const CITY_COORDINATES = {
  "Mumbai": [19.0760, 72.8777],
  "Delhi": [28.7041, 77.1025],
  "Bangalore": [12.9716, 77.5946],
  "Bengaluru": [12.9716, 77.5946], // Fallback if backend returns Bengaluru
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Hyderabad": [17.3850, 78.4867],
  "Pune": [18.5204, 73.8567],
  "Ahmedabad": [23.0225, 72.5714]
}

// ------------------------------------------------------------------------------
// ROUTING OPTIMIZER PAGE COMPONENT
// ------------------------------------------------------------------------------
function Routing() {
  const [source, setSource] = useState(CITIES[0]);
  const [destination, setDestination] = useState(CITIES[1]);
  const [useRisk, setUseRisk] = useState(true);
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (source === destination) {
      setError("Source and destination must be different.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await api.post('/routing/optimize', {
        source,
        destination,
        use_risk: useRisk
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to fetch optimal route.");
    } finally {
      setLoading(false);
    }
  };

  // Convert the selected path (array of city names) into coordinates for the map
  // We prioritize route_a (Risk-Optimized/Safe Route) for the map display
  const activePath = results?.route_a?.path || [];
  const routeCoordinates = activePath.map(city => CITY_COORDINATES[city]).filter(Boolean);

  // Check if paths are different to determine if we should render comparison cards
  // Note: Backend returns route_a (Safe Route / Risk Optimized) and route_b (Fast Route / Shortest Distance)
  const isDifferent = results && JSON.stringify(results.route_a.path) !== JSON.stringify(results.route_b.path);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Route Optimizer</h1>
        <p className="text-gray-400 text-sm mt-1">
          Evaluate transportation networks and calculate optimal transit routes.
        </p>
      </div>

      {/* Control Panel / Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
            <select 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-400 mb-1">Destination</label>
            <select 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center mb-2 px-2">
            <input 
              type="checkbox" 
              id="useRisk"
              checked={useRisk}
              onChange={(e) => setUseRisk(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useRisk" className="text-sm font-medium text-gray-400">Use Risk-Aware Routing</label>
          </div>
          
          <div className="w-full md:w-auto">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : "Find Optimal Route"}
            </button>
          </div>
        </form>
        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results Display */}
      {results && (
        <>
          {isDifferent ? (
            /* Dual Route Comparison Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Route A (Shortest Distance) - Maps to backend route_b */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold text-white mb-4">Route A (Shortest Distance)</h2>
                
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Path:</p>
                  <div className="text-white font-medium">
                    {results.route_b.path.join(" → ")}
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div>
                    <p className="text-gray-400 text-sm">Total Distance:</p>
                    <p className="text-xl font-bold text-white">{results.route_b.weight}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Est. Risk Score:</p>
                    <p className="text-xl font-bold text-white">High (Ignored)</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Route B (Risk-Optimized) - Maps to backend route_a */}
              <div className="bg-gray-800 border border-green-500 rounded-lg p-6 shadow-sm relative">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-white">Route B (Risk-Optimized)</h2>
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">SAFER ROUTE</span>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Path:</p>
                  <div className="text-white font-medium">
                    {results.route_a.path.join(" → ")}
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div>
                    <p className="text-gray-400 text-sm">Total Weight:</p>
                    <p className="text-xl font-bold text-white">{results.route_a.weight}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Single Optimal Route Card */
            <div className="bg-gray-800 border border-green-500 rounded-lg p-6 shadow-sm relative max-w-3xl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-white">Optimal Route</h2>
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">SAFEST & SHORTEST</span>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Path:</p>
                <div className="text-white font-medium">
                  {results.route_a.path.join(" → ")}
                </div>
              </div>
              
              <div className="flex gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Total Weight (Distance + Risk):</p>
                  <p className="text-xl font-bold text-white">{results.route_a.weight}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaflet Map Display */}
          <RouteMap routeCoordinates={routeCoordinates} />
        </>
      )}
    </div>
  )
}

export default Routing
