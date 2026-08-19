from sqlalchemy import create_engine
from sqlalchemy.sql import text
from core.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
coords = {
    'Delhi NCR': (28.7041, 77.1025),
    'Mumbai': (19.0760, 72.8777),
    'Chennai': (13.0827, 80.2707),
    'Kolkata': (22.5726, 88.3639),
    'Bengaluru': (12.9716, 77.5946),
    'Hyderabad': (17.3850, 78.4867)
}
with engine.connect() as conn:
    for name, (lat, lng) in coords.items():
        conn.execute(text(f"UPDATE regions SET latitude={lat}, longitude={lng} WHERE region_name='{name}';"))
    conn.commit()
print("Updated existing coords.")
