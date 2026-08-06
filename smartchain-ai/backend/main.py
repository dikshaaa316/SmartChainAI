from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.shipments import router as shipments_router
from routers.analytics import router as analytics_router
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

# ------------------------------------------------------------------------------
# ROOT ENDPOINT
# ------------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "SmartChain AI is running"}