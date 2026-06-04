import sys
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models
from main import obtener_hash_contrasena
import uuid
def seed_users():
    db: Session = SessionLocal()
    users = [
        {"correo": "comprador@autoswap.bo", "nombre": "Comprador", "rol": "comprador"},
        {"correo": "inspector@autoswap.bo", "nombre": "Inspector", "rol": "inspector"},
        {"correo": "vendedor@autoswap.bo", "nombre": "Vendedor", "rol": "vendedor"},
        {"correo": "admin@autoswap.bo", "nombre": "Admin", "rol": "admin"},
    ]
    password_plain = "TempPass123!"
    password_hash = obtener_hash_contrasena(password_plain)
    for u in users:
        existing = db.query(models.Usuario).filter(models.Usuario.correo == u["correo"]).first()
        if not existing:
            new_user = models.Usuario(
                id=str(uuid.uuid4()),
                nombre=u["nombre"],
                correo=u["correo"],
                contrasena_encriptada=password_hash,
                rol=u["rol"],
                estado="Activo",
                iniciales="".join([n[0] for n in u["nombre"].split()]).upper()[:2],
            )
            db.add(new_user)
            print(f"Created user {u['correo']}")
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_users()
