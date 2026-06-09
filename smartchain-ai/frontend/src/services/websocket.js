// ------------------------------------------------------------------------------
// WEBSOCKET SERVICE CLIENT
// ------------------------------------------------------------------------------
// Subscribes to the backend WebSocket server for receiving real-time telemetry updates.
// Usage: connectWebSocket((data) => { console.log(data); })
export function connectWebSocket(onMessage) {
  // Establish connection to the backend WebSocket endpoint
  const ws = new WebSocket('ws://localhost:8000/ws')

  // Listen for message events
  ws.onmessage = (event) => {
    try {
      // Parse the incoming JSON message body
      const data = JSON.parse(event.data)
      
      // Dispatch the parsed payload to the handler callback
      if (onMessage) {
        onMessage(data)
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message data:", error)
    }
  }

  // Handle errors
  ws.onerror = (error) => {
    console.error("WebSocket connection encountered an error:", error)
  }

  // Handle closure
  ws.onclose = () => {
    console.warn("WebSocket connection closed. Retrying connection omitted in scaffold.")
  }

  return ws
}
