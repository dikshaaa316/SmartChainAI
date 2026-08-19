from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import Shipment
from schemas import ShipmentCreate, ShipmentResponse
from core.eta_engine import calculate_eta

# ------------------------------------------------------------------------------
# ROUTER CONFIGURATION
# ------------------------------------------------------------------------------
# Define the shipment routes router with /shipments prefix and Shipments tag
router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)

# ------------------------------------------------------------------------------
# ENDPOINTS
# ------------------------------------------------------------------------------

@router.post("/", response_model=ShipmentResponse)
def create_shipment(shipment: ShipmentCreate, request: Request, db: Session = Depends(get_db)):
    """
    Create a new Shipment in the database.
    Accepts ShipmentCreate data, saves it, and returns the full ShipmentResponse object.
    """
    # Create the database ORM instance using fields from the schema
    db_shipment_data = shipment.model_dump()
    
    # Auto-calculate ETA (distance / 40 km/h)
    eta_hours = shipment.distance / 40
    db_shipment_data["eta"] = f"Estimated in {int(eta_hours)} hours"

    # Auto-calculate delay probability using the ML model and average region risk
    from models import Region
    import numpy as np
    regions = db.query(Region).all()
    if regions:
        weather_avg = sum(r.weather_score for r in regions) / len(regions)
        traffic_avg = sum(r.traffic_score for r in regions) / len(regions)
        warehouse_avg = sum(r.warehouse_score for r in regions) / len(regions)
    else:
        weather_avg, traffic_avg, warehouse_avg = 50.0, 50.0, 50.0

    delay_prob = 0.0
    if hasattr(request.app.state, 'model') and request.app.state.model:
        features = np.array([[shipment.distance, weather_avg, traffic_avg, warehouse_avg]])
        try:
            delay_prob = float(request.app.state.model.predict_proba(features)[0][1])
        except Exception:
            delay_prob = 0.0
            
    db_shipment_data["delay_probability"] = delay_prob
    db_shipment = Shipment(**db_shipment_data)
    
    # Save the instance to the database
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    
    # Calculating current_eta at request time ensures we are always using the 
    # most up-to-date ML model and dynamic region state without cron overhead.
    db_shipment.original_eta = db_shipment.eta
    db_shipment.current_eta = calculate_eta(db_shipment, db, request.app.state.model)
    
    return db_shipment


@router.get("/", response_model=List[ShipmentResponse])
def read_shipments(request: Request, db: Session = Depends(get_db)):
    """
    Retrieve all shipments from the database.
    Returns a list of ShipmentResponse objects.
    """
    # Query all shipments from the database table
    shipments = db.query(Shipment).all()
    for s in shipments:
        s.original_eta = s.eta
        s.current_eta = calculate_eta(s, db, request.app.state.model)
    return shipments


@router.get("/{shipment_id}", response_model=ShipmentResponse)
def read_shipment(shipment_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Retrieve a single shipment by its ID.
    Raises a 404 HTTP Exception if the shipment is not found.
    """
    # Query the shipment by primary key ID
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    db_shipment.original_eta = db_shipment.eta
    db_shipment.current_eta = calculate_eta(db_shipment, db, request.app.state.model)
    return db_shipment


@router.put("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(shipment_id: int, shipment: ShipmentCreate, request: Request, db: Session = Depends(get_db)):
    """
    Update all fields of a shipment by its ID.
    Raises a 404 HTTP Exception if the shipment does not exist.
    """
    # Query the shipment by primary key ID
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Update fields with the input values
    db_shipment.source = shipment.source
    db_shipment.destination = shipment.destination
    db_shipment.current_lat = shipment.current_lat
    db_shipment.current_lng = shipment.current_lng
    db_shipment.distance = shipment.distance
    db_shipment.eta = f"Estimated in {int(shipment.distance / 40)} hours"
    
    # Commit changes to database and refresh the object
    db.commit()
    db.refresh(db_shipment)
    
    db_shipment.original_eta = db_shipment.eta
    db_shipment.current_eta = calculate_eta(db_shipment, db, request.app.state.model)
    return db_shipment


@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: int, db: Session = Depends(get_db)):
    """
    Delete a shipment by its ID.
    Raises a 404 HTTP Exception if the shipment is not found.
    """
    # Query the shipment by primary key ID
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Remove the record and commit the transaction
    db.delete(db_shipment)
    db.commit()
    
    return {"message": "Shipment deleted successfully"}
