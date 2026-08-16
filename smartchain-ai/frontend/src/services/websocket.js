// ------------------------------------------------------------------------------
// WEBSOCKET SERVICE CLIENT
// ------------------------------------------------------------------------------
// Subscribes to the backend WebSocket server for receiving real-time telemetry updates.
// Reconnects automatically on close with a 3-second retry.
export function connectWebSocket(onMessage, onStatusChange) {
  let ws = null
  let isClosed = false
  
  const connect = () => {
    if (isClosed) return;
    
    if (onStatusChange) onStatusChange('connecting')
    
    ws = new WebSocket('ws://localhost:8000/ws')

    ws.onopen = () => {
      if (onStatusChange) onStatusChange('connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (onMessage) onMessage(data)
      } catch (error) {
        console.error("Failed to parse WebSocket message data:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket connection encountered an error:", error)
    }

    ws.onclose = () => {
      if (isClosed) return;
      if (onStatusChange) onStatusChange('reconnecting')
      console.warn("WebSocket closed. Reconnecting in 3 seconds...")
      setTimeout(() => {
        connect()
      }, 3000)
    }
  }

  connect()

  // Return a cleanup function
  return () => {
    isClosed = true
    if (ws) {
      ws.close()
    }
  }
}
