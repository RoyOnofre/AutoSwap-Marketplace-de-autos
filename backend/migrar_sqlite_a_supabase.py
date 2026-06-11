# backend/migrar_sqlite_a_supabase.py
"""Script de migración de datos desde SQLite (techstore.db) a Supabase.
Este script:
1️⃣ Conecta a la base SQLite local.
2️⃣ Conecta al motor PostgreSQL de Supabase (ya configurado en `backend/database.py`).
3️⃣ Copia los registros de todas las tablas respetando las dependencias FK.
4️⃣ Usa `ON CONFLICT DO NOTHING` para evitar duplicados si se ejecuta más de una vez.

Ejecutar con:
    python backend/migrar_sqlite_a_supabase.py
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Configuración de URLs de base de datos
# ---------------------------------------------------------------------------
SQLITE_URL = "sqlite:///techstore.db"
# La URL de Supabase ya está en la variable de entorno SUPABASE_DATABASE_URL
SUPABASE_URL = os.getenv(
    "SUPABASE_DATABASE_URL",
    "postgresql://postgres.eiwmwozjquranqqniwrp:5jwyfwos0209@aws-0-us-west-2.pooler.supabase.com:5432/postgres",
)

# Engines para ambas bases
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
supabase_engine = create_engine(SUPABASE_URL)

# Orden de tablas – de mayor a menor dependencia (FKs)
TABLAS = [
    "usuarios",
    "vehiculos",
    "fotos_vehiculo",
    "caracteristica_vehiculo",
    "compras",
    "ventas",
    "auditoria",
]

def migrar():
    print("Iniciando migración de SQLite -> Supabase...")
    with Session(sqlite_engine) as src, Session(supabase_engine) as dst:
        for tabla in TABLAS:
            # Obtener columnas de la tabla en SQLite
            result = src.execute(text(f"SELECT * FROM {tabla} LIMIT 0"))
            columnas = [desc[0] for desc in result.cursor.description]
            # Extraer todas las filas
            filas = src.execute(text(f"SELECT * FROM {tabla}")).fetchall()
            if not filas:
                print(f"[INFO] Tabla {tabla} está vacía, se omite.")
                continue
            print(f"[INFO] Migrando {len(filas)} filas de {tabla}...")
            for fila in filas:
                datos = dict(zip(columnas, fila))
                # Construir sentencia INSERT con placeholders
                placeholders = ", ".join([f":{c}" for c in columnas])
                cols_joined = ", ".join(columnas)
                stmt = text(
                    f"INSERT INTO {tabla} ({cols_joined}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                )
                dst.execute(stmt, datos)
            dst.commit()
            print(f"[OK] Tabla {tabla} migrada.")
    print("Migración completada.")

if __name__ == "__main__":
    migrar()
