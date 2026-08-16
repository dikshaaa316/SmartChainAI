import datetime
from sqlalchemy.orm import Session
import numpy as np
from models import Region

# ETA Calculation Formula:
# current_eta = base_eta + (regional_risk_score_factor) + (ml_predicted_delay_minutes)
#
# Assumptions:
# 1. base_eta is derived from the shipment's 'eta' field (parsed as ISO datetime, or falling back to current UTC time if invalid).
# 2. regional_risk_score_factor is a linear scale: each point of the region's risk_score adds 2 minutes of delay.
# 3. ml_predicted_delay_minutes uses the delay model's probability of delay (0.0 to 1.0) multiplied by a maximum of 100 minutes.
def calculate_eta(shipment, db: Session, model=None):
    # Retrieve destination region to calculate risk impact
    region = db.query(Region).filter(Region.region_name == shipment.destination).first()
    
    weather = region.weather_score if region else 50
    traffic = region.traffic_score if region else 50
    warehouse = region.warehouse_score if region else 50
    risk = region.risk_score if region else 50

    # Linear scale: 2 minutes per risk score point
    risk_factor_minutes = risk * 2 

    ml_delay = 0
    if model:
        # Model expects: [distance, weather_score, traffic_score, warehouse_load]
        features = np.array([[shipment.distance, weather, traffic, warehouse]])
        # predict_proba returns [[prob_no_delay, prob_delay]]
        proba = model.predict_proba(features)[0][1]
        ml_delay = proba * 100
        
    total_delay_minutes = risk_factor_minutes + ml_delay
    
    # Attempt to parse original ETA, fallback to current time if user inputted a plain string
    try:
        base_eta = datetime.datetime.fromisoformat(shipment.eta)
    except Exception:
        base_eta = datetime.datetime.utcnow()
        
    current_eta = base_eta + datetime.timedelta(minutes=total_delay_minutes)
    
    # Return formatted ISO string for frontend to parse
    return current_eta.isoformat()
