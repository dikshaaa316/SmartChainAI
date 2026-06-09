import axios from 'axios'

// ------------------------------------------------------------------------------
// API SERVICE CLIENT
// ------------------------------------------------------------------------------
// Configure a global Axios instance for interacting with the FastAPI backend.
// The baseURL points to the local FastAPI port 8000.
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api
