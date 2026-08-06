from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Region
from schemas import RegionCreate, RegionResponse
from core.risk_engine import RiskEngine
from typing import List
import joblib
import numpy as np

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# ------------------------------------
# PREDICT DELAY
# ------------------------------------
@router.post("/predict-delay")
def predict_delay(data: dict, request: Request):
    model = request.app.state.model
    if model is None:
        return {"error": "Model not loaded yet"}
    
    features = np.array([[
        data["distance"],
        data["weather_score"],
        data["traffic_score"],
        data["warehouse_load"]
    ]])
    
    proba = model.predict_proba(features)[0][1]
    
    if proba > 0.6:
        risk_level = "High"
    elif proba > 0.3:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    return {
        "delay_probability": round(float(proba), 4),
        "risk_level": risk_level
    }

# ------------------------------------
# CREATE REGION
# ------------------------------------
@router.post("/regions/", response_model=RegionResponse)
def create_region(region: RegionCreate, db: Session = Depends(get_db)):
    risk_score = RiskEngine.calculate_risk(
        region.weather_score,
        region.traffic_score,
        region.warehouse_score
    )
    db_region = Region(**region.dict(), risk_score=risk_score)
    db.add(db_region)
    db.commit()
    db.refresh(db_region)
    return db_region

# ------------------------------------
# GET ALL REGIONS
# ------------------------------------
@router.get("/regions/", response_model=List[RegionResponse])
def get_regions(db: Session = Depends(get_db)):
    return db.query(Region).all()

# ------------------------------------
# SEED REGIONS
# ------------------------------------
@router.post("/regions/seed")
def seed_regions(db: Session = Depends(get_db)):
    regions = [
        {"region_name": "Delhi NCR", "weather_score": 65, "traffic_score": 80, "warehouse_score": 70},
        {"region_name": "Mumbai", "weather_score": 55, "traffic_score": 85, "warehouse_score": 60},
        {"region_name": "Chennai", "weather_score": 70, "traffic_score": 60, "warehouse_score": 50},
        {"region_name": "Kolkata", "weather_score": 75, "traffic_score": 65, "warehouse_score": 80},
        {"region_name": "Bengaluru", "weather_score": 45, "traffic_score": 75, "warehouse_score": 55},
        {"region_name": "Hyderabad", "weather_score": 50, "traffic_score": 60, "warehouse_score": 45},
    ]
    added = []
    for r in regions:
        exists = db.query(Region).filter(Region.region_name == r["region_name"]).first()
        if not exists:
            risk_score = RiskEngine.calculate_risk(r["weather_score"], r["traffic_score"], r["warehouse_score"])
            db_region = Region(**r, risk_score=risk_score)
            db.add(db_region)
            added.append(r["region_name"])
    db.commit()
    return {"message": f"Seeded {len(added)} regions", "regions": added}