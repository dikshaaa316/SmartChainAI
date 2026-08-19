from sqlalchemy import create_engine
from sqlalchemy.sql import text
from core.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE regions ADD COLUMN latitude FLOAT;"))
        conn.commit()
    except Exception as e:
        print(e)
    
    try:
        conn.execute(text("ALTER TABLE regions ADD COLUMN longitude FLOAT;"))
        conn.commit()
    except Exception as e:
        print(e)

print("Altered.")
