
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_auditoria():
    db = SessionLocal()
    try:
        logs = db.query(models.Auditoria).order_by(models.Auditoria.fecha.desc()).limit(10).all()
        print(f"Recent audit logs:")
        for log in logs:
            user_name = log.usuario.nombre if log.usuario else "Sistema"
            print(f"[{log.fecha}] {user_name} - {log.accion}: {log.descripcion}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_auditoria()
