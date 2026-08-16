from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from routers.shipments import router as shipments_router
from routers.analytics import router as analytics_router
from routers.routing import router as routing_router
import joblib
import os

# ------------------------------------------------------------------------------
# FASTAPI APPLICATION SETUP
# ------------------------------------------------------------------------------
app = FastAPI(title="SmartChain AI")

# ------------------------------------------------------------------------------
# LOAD ML MODEL ON STARTUP
# ------------------------------------------------------------------------------
@app.on_event("startup")
def load_model():
    model_path = "ml_engine/delay_model.pkl"
    if os.path.exists(model_path):
        app.state.model = joblib.load(model_path)
        print("ML model loaded successfully")
    else:
        app.state.model = None
        print("WARNING: ML model not found. Run train_model.py first.")

# ------------------------------------------------------------------------------
# CORS MIDDLEWARE
# ------------------------------------------------------------------------------
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# REGISTER ROUTERS
# ------------------------------------------------------------------------------
app.include_router(shipments_router)
app.include_router(analytics_router)
app.include_router(routing_router)

# ------------------------------------------------------------------------------
# ROOT ENDPOINT
# ------------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "SmartChain AI is running"}

# ------------------------------------------------------------------------------
# WEBSOCKET MANAGER
# ------------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()
app.state.ws_manager = manager

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection, wait for disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)