from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Shipment, Warehouse, Region, Alert

def generate_alerts(db: Session):
    """
    Consolidates alert generation rules for the entire system.
    Runs a 10-minute deduplication check to avoid spamming the alerts table.
    """
    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)

    def alert_exists(message: str, severity: str) -> bool:
        return db.query(Alert).filter(
            Alert.message == message,
            Alert.severity == severity,
            Alert.created_at >= ten_mins_ago
        ).first() is not None

    def create_alert_if_new(message: str, severity: str, shipment_id: int):
        if not alert_exists(message, severity):
            alert = Alert(
                shipment_id=shipment_id,
                message=message,
                severity=severity
            )
            db.add(alert)
    
    # Retrieve or create a system fallback shipment for non-shipment alerts
    system_shipment = db.query(Shipment).first()
    if not system_shipment:
        system_shipment = Shipment(
            source="System", destination="System",
            current_lat=0.0, current_lng=0.0,
            status="Pending", distance=0.0, eta="N/A",
            delay_probability=0.0
        )
        db.add(system_shipment)
        db.commit()
        db.refresh(system_shipment)
    sys_id = system_shipment.id

    # 1. Shipment delay rules
    shipments = db.query(Shipment).all()
    for s in shipments:
        if s.delay_probability > 0.7:
            msg = f"Shipment #{s.id} delayed: {(s.delay_probability * 100):.1f}% probability"
            create_alert_if_new(msg, "High", s.id)
        elif s.delay_probability >= 0.4:
            msg = f"Shipment #{s.id} delayed: {(s.delay_probability * 100):.1f}% probability"
            create_alert_if_new(msg, "Medium", s.id)
            
    # 2. Warehouse utilization rule
    warehouses = db.query(Warehouse).all()
    for w in warehouses:
        if w.utilization > 90:
            msg = f"{w.warehouse_name} at {round(w.utilization, 1)}% capacity"
            create_alert_if_new(msg, "High", sys_id)

    # 3. Region risk rule
    regions = db.query(Region).all()
    for r in regions:
        if r.risk_score > 70:
            msg = f"Region {r.region_name} experiencing high risk conditions"
            create_alert_if_new(msg, "Medium", sys_id)
            
    db.commit()
