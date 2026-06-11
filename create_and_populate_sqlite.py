# create_and_populate_sqlite.py
"""Create a fresh SQLite database (techstore.db) using the SQLAlchemy models
and copy all existing data from Supabase into it. This allows the migration
script to later copy data back to Supabase (idempotent) and ensures the
SQLite file contains the same schema and rows as the production database.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from backend.database import engine as supabase_engine  # existing Supabase engine
from backend import models  # import models to access Base metadata

# ---------------------------------------------------------------------------
# SQLite configuration
# ---------------------------------------------------------------------------
SQLITE_URL = "sqlite:///techstore.db"
sqlite_engine = create_engine(SQLITE_URL)

# Create all tables in SQLite according to the models metadata
print("Creating SQLite schema...")
models.Base.metadata.create_all(sqlite_engine)
print("SQLite schema created.")

# List of tables in dependency order (parents first)
TABLES = [
    "usuarios",
    "vehiculos",
    "fotos_vehiculo",
    "caracteristicas_vehiculo",
    "compras",
    "ventas",
    "auditoria",
    "caracteristica_vehiculo",
    "detalle_venta",
    "oferta",
    "inspeccion",
    "calificacion",
    "cliente",
    "proveedor",
    "producto",
    "registro_auditoria_validacion",
    "configuracion",
    "anuncio",
]

print("Starting data copy from Supabase to SQLite...")
with Session(supabase_engine) as src, Session(sqlite_engine) as dst:
    for tbl in TABLES:
        # Get column names from Supabase
        result = src.execute(text(f"SELECT * FROM {tbl} LIMIT 0"))
        columns = [desc[0] for desc in result.cursor.description]
        rows = src.execute(text(f"SELECT * FROM {tbl}")).fetchall()
        if not rows:
            print(f"[INFO] Table {tbl} is empty, skipping.")
            continue
        print(f"[INFO] Copying {len(rows)} rows into {tbl}...")
        for row in rows:
            data = dict(zip(columns, row))
            placeholders = ", ".join([f":{c}" for c in columns])
            cols_joined = ", ".join(columns)
            stmt = text(
                f"INSERT INTO {tbl} ({cols_joined}) VALUES ({placeholders})"
            )
            dst.execute(stmt, data)
        dst.commit()
        print(f"[OK] Table {tbl} copied.")
print("Data copy completed.")
