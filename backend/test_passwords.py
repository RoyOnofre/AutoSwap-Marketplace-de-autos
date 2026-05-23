
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from database import SQLALCHEMY_DATABASE_URL
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_passwords():
    db = SessionLocal()
    try:
        checks = [
            ("admin@techstore.com", "admin123"),
            ("cajero@techstore.com", "cajero123"),
            ("roy.oa11@gmail.com", "admin123"), # Guessing
            ("roy.oa10@gmail.com", "cajero123"), # Guessing
        ]
        
        for email, password in checks:
            user = db.query(models.Usuario).filter(models.Usuario.correo == email).first()
            if user:
                is_correct = pwd_context.verify(password, user.contrasena_encriptada)
                print(f"User: {email} | Password '{password}' is {'CORRECT' if is_correct else 'WRONG'}")
            else:
                print(f"User: {email} | NOT FOUND")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_passwords()
