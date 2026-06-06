from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.shipments import router as shipments_router

# ------------------------------------------------------------------------------
# FASTAPI APPLICATION SETUP
# ------------------------------------------------------------------------------
# Instantiating the core FastAPI application.
app = FastAPI(title="SmartChain AI")

# Include the shipments router
app.include_router(shipments_router)

# ------------------------------------------------------------------------------
# CORS (Cross-Origin Resource Sharing) MIDDLEWARE
# ------------------------------------------------------------------------------
# CORS middleware is configured to authorize frontend client connections.
# In this setup, we permit requests from our local frontend development server.
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all HTTP headers
)

# ------------------------------------------------------------------------------
# ROUTING & ENDPOINTS
# ------------------------------------------------------------------------------
# Default root route to check the status of the SmartChain AI backend.
@app.get("/")
def read_root():
    return {"message": "SmartChain AI is running"}
