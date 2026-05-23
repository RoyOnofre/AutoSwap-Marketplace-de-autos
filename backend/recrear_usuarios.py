"""
recrear_usuarios.py
────────────────────────────────────────────────
Script de utilidad para TechStore Manager.
Elimina todos los usuarios existentes y crea los
usuarios base del sistema (admin y cajero demo).

Uso:
    python recrear_usuarios.py
"""

from .database import SessionLocal, engine
from . import models
import uuid
from passlib.context import CryptContext

from sqlalchemy import text

# Asegurar que las tablas existan
models.Base.metadata.create_all(bind=engine)

# Master Tip: Si la tabla ya existe, create_all no agregará columnas nuevas.
# Ejecutamos un ALTER TABLE manual para asegurar que las columnas existan.
with engine.connect() as connection:
    try:
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP;"))
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS kyc_estado VARCHAR DEFAULT 'Pendiente';"))
        connection.commit()
        print("[OK] Columnas 'ultimo_login' y 'kyc_estado' verificadas/agregadas.")
    except Exception as e:
        print(f"[INFO] No se pudo alterar la tabla: {e}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USUARIOS_BASE = [
    {
        "nombre": "Admin AutoSwap",
        "correo": "admin@autoswap.bo",
        "contrasena": "admin123",
        "rol": "admin",
        "estado": "Activo",
        "kyc_estado": "Aprobado",
    },
    {
        "nombre": "Vendedor Demo",
        "correo": "vendedor@autoswap.bo",
        "contrasena": "vendedor123",
        "rol": "vendedor",
        "estado": "Activo",
        "kyc_estado": "Aprobado",
    },
    {
        "nombre": "Comprador Demo",
        "correo": "comprador@autoswap.bo",
        "contrasena": "comprador123",
        "rol": "comprador",
        "estado": "Activo",
        "kyc_estado": "Aprobado",
    },
    {
        "nombre": "Inspector Certificado",
        "correo": "inspector@autoswap.bo",
        "contrasena": "inspector123",
        "rol": "inspector",
        "estado": "Activo",
        "kyc_estado": "Aprobado",
    },
]

def recrear_usuarios():
    bd = SessionLocal()
    try:
        # 1. Borrar registros dependientes para evitar violación de llaves foráneas
        bd.query(models.Auditoria).delete()
        bd.query(models.DetalleVenta).delete()
        bd.query(models.Venta).delete()
        bd.query(models.MovimientoInventario).delete()
        
        # 2. Borrar usuarios existentes
        eliminados = bd.query(models.Usuario).delete()
        bd.commit()
        print(f"[OK] {eliminados} usuario(s) eliminado(s).")

        # 2. Crear usuarios base
        for datos in USUARIOS_BASE:
            iniciales = "".join([n[0] for n in datos["nombre"].split()]).upper()[:2]
            nuevo = models.Usuario(
                id=str(uuid.uuid4()),
                nombre=datos["nombre"],
                correo=datos["correo"],
                contrasena_encriptada=pwd_context.hash(datos["contrasena"]),
                rol=datos["rol"],
                estado=datos["estado"],
                kyc_estado=datos["kyc_estado"],
                iniciales=iniciales,
            )
            bd.add(nuevo)
            print(f"   [+] Creando: {datos['nombre']} ({datos['rol']}) - {datos['correo']}")

        bd.commit()
        print("\n[OK] Usuarios base creados exitosamente.")
        print("-" * 45)
        print("  admin@autoswap.bo      -> admin123")
        print("  vendedor@autoswap.bo   -> vendedor123")
        print("  comprador@autoswap.bo  -> comprador123")
        print("  inspector@autoswap.bo  -> inspector123")
        print("-" * 45)

    except Exception as e:
        bd.rollback()
        print(f"[ERROR]: {e}")
    finally:
        bd.close()

if __name__ == "__main__":
    print("=" * 45)
    print("  TechStore — Recrear Usuarios Base")
    print("=" * 45)
    recrear_usuarios()
