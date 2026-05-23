
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_users():
    db = SessionLocal()
    try:
        users = db.query(models.Usuario).all()
        print(f"Total users found: {len(users)}")
        for user in users:
            print(f"ID: {user.id} | Name: {user.nombre} | Email: {user.correo} | Role: {user.rol} | Status: {user.estado}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
