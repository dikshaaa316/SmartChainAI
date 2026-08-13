from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Region, Warehouse, Alert, Shipment
from schemas import RegionCreate, RegionResponse, WarehouseCreate, WarehouseResponse, AlertResponse
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

# ------------------------------------
# WAREHOUSE ENDPOINTS
# ------------------------------------

@router.post("/warehouses/", response_model=WarehouseResponse)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    """
    Create a new warehouse, calculate utilization, and create a high severity alert
    if utilization exceeds 90%.
    """
    utilization = (warehouse.current_load / warehouse.capacity) * 100 if warehouse.capacity > 0 else 0.0
    db_warehouse = Warehouse(
        warehouse_name=warehouse.warehouse_name,
        capacity=warehouse.capacity,
        current_load=warehouse.current_load,
        utilization=utilization
    )
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)

    # Generate high severity alert if utilization exceeds 90%
    if utilization > 90:
        shipment = db.query(Shipment).first()
        if not shipment:
            shipment = Shipment(
                source="System",
                destination="System",
                current_lat=0.0,
                current_lng=0.0,
                status="Pending",
                distance=0.0,
                eta="N/A",
                delay_probability=0.0
            )
            db.add(shipment)
            db.commit()
            db.refresh(shipment)

        alert = Alert(
            shipment_id=shipment.id,
            message=f"Warehouse {db_warehouse.warehouse_name} is at {utilization}% capacity",
            severity="High"
        )
        db.add(alert)
        db.commit()

    return db_warehouse


@router.get("/warehouses/", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    """
    Get list of all warehouses.
    """
    return db.query(Warehouse).all()


@router.post("/warehouses/seed")
def seed_warehouses(db: Session = Depends(get_db)):
    """
    Seed the 4 default hubs if they don't already exist.
    """
    warehouses_data = [
        {"warehouse_name": "Mumbai Hub", "capacity": 1000, "current_load": 920},
        {"warehouse_name": "Delhi Hub", "capacity": 800, "current_load": 650},
        {"warehouse_name": "Chennai Hub", "capacity": 600, "current_load": 580},
        {"warehouse_name": "Kolkata Hub", "capacity": 750, "current_load": 400},
    ]
    added = []
    for w in warehouses_data:
        exists = db.query(Warehouse).filter(Warehouse.warehouse_name == w["warehouse_name"]).first()
        if not exists:
            utilization = (w["current_load"] / w["capacity"]) * 100 if w["capacity"] > 0 else 0.0
            db_warehouse = Warehouse(
                warehouse_name=w["warehouse_name"],
                capacity=w["capacity"],
                current_load=w["current_load"],
                utilization=utilization
            )
            db.add(db_warehouse)
            db.commit()
            db.refresh(db_warehouse)

            # If utilization > 90, create warning alert
            if utilization > 90:
                shipment = db.query(Shipment).first()
                if not shipment:
                    shipment = Shipment(
                        source="System",
                        destination="System",
                        current_lat=0.0,
                        current_lng=0.0,
                        status="Pending",
                        distance=0.0,
                        eta="N/A",
                        delay_probability=0.0
                    )
                    db.add(shipment)
                    db.commit()
                    db.refresh(shipment)

                alert = Alert(
                    shipment_id=shipment.id,
                    message=f"Warehouse {db_warehouse.warehouse_name} is at {utilization}% capacity",
                    severity="High"
                )
                db.add(alert)
                db.commit()
            added.append(w["warehouse_name"])

    return {"message": f"Seeded {len(added)} warehouses", "warehouses": added}


@router.get("/alerts/", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """
    Get list of all alerts.
    """
    return db.query(Alert).all()