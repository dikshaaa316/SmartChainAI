from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Region, Warehouse, Alert, Shipment
from schemas import RegionCreate, RegionResponse, WarehouseCreate, WarehouseResponse, AlertResponse
from core.risk_engine import RiskEngine
from typing import List
import joblib
import numpy as np
from pydantic import BaseModel

class RegionHeatmapResponse(BaseModel):
    region_name: str
    latitude: float
    longitude: float
    risk_score: float

CITY_COORDINATES = {
    "Delhi NCR": (28.6139, 77.2090),
    "Mumbai": (19.0760, 72.8777),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
}

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

@router.get("/regions", response_model=List[RegionHeatmapResponse])
def get_heatmap_regions(db: Session = Depends(get_db)):
    regions = db.query(Region).all()
    result = []
    for r in regions:
        coords = CITY_COORDINATES.get(r.region_name, (0.0, 0.0))
        result.append({
            "region_name": r.region_name,
            "latitude": coords[0],
            "longitude": coords[1],
            "risk_score": r.risk_score
        })
    return result

# ------------------------------------
# SEED REGIONS
# ------------------------------------
@router.post("/regions/seed")
def seed_regions(db: Session = Depends(get_db)):
    regions = [
        {"region_name": "Delhi NCR", "weather_score": 65, "traffic_score": 80, "warehouse_score": 70, "latitude": 28.7041, "longitude": 77.1025},
        {"region_name": "Mumbai", "weather_score": 55, "traffic_score": 85, "warehouse_score": 60, "latitude": 19.0760, "longitude": 72.8777},
        {"region_name": "Chennai", "weather_score": 70, "traffic_score": 60, "warehouse_score": 50, "latitude": 13.0827, "longitude": 80.2707},
        {"region_name": "Kolkata", "weather_score": 75, "traffic_score": 65, "warehouse_score": 80, "latitude": 22.5726, "longitude": 88.3639},
        {"region_name": "Bengaluru", "weather_score": 45, "traffic_score": 75, "warehouse_score": 55, "latitude": 12.9716, "longitude": 77.5946},
        {"region_name": "Hyderabad", "weather_score": 50, "traffic_score": 60, "warehouse_score": 45, "latitude": 17.3850, "longitude": 78.4867},
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


@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    """
    Get list of all warehouses with utilization rounded to 1 decimal.
    """
    warehouses = db.query(Warehouse).all()
    for w in warehouses:
        w.utilization = round(w.utilization, 1)
    return warehouses

@router.post("/simulate/tick")
async def simulate_tick(request: Request, db: Session = Depends(get_db)):
    """
    Simulates a time tick, updating warehouse loads randomly.
    Broadcasts the new state (shipments, alerts, warehouses) via WebSockets.
    """
    import random
    from core.alert_engine import generate_alerts
    
    warehouses = db.query(Warehouse).all()
    for w in warehouses:
        # random change between -50 and +150 load to push over 90%
        change = random.randint(-50, 150)
        new_load = max(0, min(w.capacity, w.current_load + change))
        w.current_load = new_load
        w.utilization = (new_load / w.capacity) * 100 if w.capacity > 0 else 0.0
    
    db.commit()
    
    # Consolidate all alert checks here
    generate_alerts(db)
    
    # Fetch updated state utilizing existing logic to send over WS
    from routers.shipments import read_shipments
    shipments = read_shipments(request, db)
    alerts = get_alerts(db)
    warehouses = get_warehouses(db)
    
    # Broadcast via WS Manager
    ws_manager = request.app.state.ws_manager
    if ws_manager:
        payload = {
            "type": "update",
            "shipments": [s.model_dump(mode="json") if hasattr(s, "model_dump") else s.__dict__ for s in shipments],
            "alerts": [a.__dict__ for a in alerts],
            "warehouses": [w.__dict__ for w in warehouses]
        }
        # Serialize fields like datetime safely
        def safe_serialize(obj):
            if isinstance(obj, dict):
                return {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in obj.items() if not k.startswith('_')}
            return obj
        
        payload["shipments"] = [safe_serialize(s) for s in payload["shipments"]]
        payload["alerts"] = [safe_serialize(a) for a in payload["alerts"]]
        payload["warehouses"] = [safe_serialize(w) for w in payload["warehouses"]]
        
        await ws_manager.broadcast(payload)
    
    return {"message": "Simulation tick completed and broadcasted"}


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
    Get list of all alerts sorted by created_at descending, most recent first, limited to 50.
    """
    return db.query(Alert).order_by(Alert.created_at.desc()).limit(50).all()