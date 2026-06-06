from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base, engine

# ------------------------------------------------------------------------------
# SHIPMENT MODEL
# ------------------------------------------------------------------------------
class Shipment(Base):
    """
    Represents a shipment tracking object in the supply chain system.
    Tracks location, status, estimated time of arrival, distance, and predicted risk of delay.
    """
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    status = Column(String, default="Pending", nullable=False)
    distance = Column(Float, nullable=False)
    eta = Column(String, nullable=False)
    delay_probability = Column(Float, default=0.0, nullable=False)


# ------------------------------------------------------------------------------
# REGION MODEL
# ------------------------------------------------------------------------------
class Region(Base):
    """
    Represents geographical regions with calculated metrics.
    Weather, traffic, and warehouse scores are consolidated into an overall risk score.
    """
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True)
    region_name = Column(String, unique=True, nullable=False)
    weather_score = Column(Float, nullable=False)
    traffic_score = Column(Float, nullable=False)
    warehouse_score = Column(Float, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)


# ------------------------------------------------------------------------------
# WAREHOUSE MODEL
# ------------------------------------------------------------------------------
class Warehouse(Base):
    """
    Represents warehouse inventory/capacity locations.
    Stores names, capacities, loads, and utilization percentages.
    """
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True)
    warehouse_name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_load = Column(Integer, nullable=False)
    utilization = Column(Float, default=0.0, nullable=False)


# ------------------------------------------------------------------------------
# ALERT MODEL
# ------------------------------------------------------------------------------
class Alert(Base):
    """
    System generated risk notification alert linked to a specific shipment.
    Categorized by severity ("Low", "Medium", "High").
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # Allowed options: "Low", "Medium", "High"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ------------------------------------------------------------------------------
# METADATA CREATION
# ------------------------------------------------------------------------------
# Create the tables in the database if they do not exist yet.
Base.metadata.create_all(bind=engine)
