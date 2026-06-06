import os
from dotenv import load_dotenv

# ------------------------------------------------------------------------------
# ENVIRONMENT CONFIGURATION LOAD
# ------------------------------------------------------------------------------
# Load environment variables from a .env file located at the root of the backend directory.
load_dotenv()

# ------------------------------------------------------------------------------
# DATABASE SETTINGS
# ------------------------------------------------------------------------------
# Retrieve the DATABASE_URL environment variable.
# Fallback/Default value points to a local PostgreSQL instance: 'smartchain_db'.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/smartchain_db"
)
