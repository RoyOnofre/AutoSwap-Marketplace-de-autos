import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase PostgreSQL connection URL (required)
# Expected to be set in .env as SUPABASE_DATABASE_URL
SQLALCHEMY_DATABASE_URL = os.getenv(
    "SUPABASE_DATABASE_URL",
    "postgresql://postgres.eiwmwozjquranqqniwrp:5jwyfwos0209@aws-0-us-west-2.pooler.supabase.com:5432/postgres",
)

# Create the engine; PostgreSQL does not need check_same_thread
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
