import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# URL de conexión directa (La forma más estable para SQLAlchemy en Render)
URL_SEGURA = "postgresql+psycopg2://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.co:5432/postgres?sslmode=require"

# Si Render tiene la variable configurada en la web, usa esa; si no, usa la URL fija de arriba
SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL", URL_SEGURA)

# Create the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()