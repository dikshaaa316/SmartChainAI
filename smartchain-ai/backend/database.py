from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from core.config import DATABASE_URL

# ------------------------------------------------------------------------------
# DATABASE ENGINE CREATION
# ------------------------------------------------------------------------------
# The Engine acts as the interface to the database. It handles connection pooling
# and translates SQLAlchemy queries to SQL commands appropriate for our DB dialect.
engine = create_engine(DATABASE_URL)

# ------------------------------------------------------------------------------
# SESSION MAKER CONFIGURATION
# ------------------------------------------------------------------------------
# SessionLocal is a factory for Session objects. Individual sessions represent a workspace
# for database operations. We disable automatic commit and flush to maintain control
# over transactions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ------------------------------------------------------------------------------
# DECLARATIVE BASE CLASS
# ------------------------------------------------------------------------------
# Base class used to map python classes directly to database tables.
# All ORM models (e.g. Shipment, Route) will inherit from this class.
Base = declarative_base()

# ------------------------------------------------------------------------------
# DATABASE SESSION DEPENDENCY (get_db)
# ------------------------------------------------------------------------------
# Dependency function helper that yields a new SQLAlchemy session for use during
# an API request. The session is guaranteed to close in the finally block after the request
# lifecycle is complete.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
