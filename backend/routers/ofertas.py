from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models
import uuid

router = APIRouter(prefix="/api/ofertas", tags=["Ofertas"])

# Dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=dict)
def crear_oferta(oferta: dict, db: Session = Depends(get_db)):
    # Ensure the dict contains an 'id' key; generate one if missing
    if not oferta.get("id"):
        oferta["id"] = str(uuid.uuid4())
    nuevo = models.Oferta(**oferta)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Oferta creada", "id": nuevo.id}

def listar_ofertas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Oferta).offset(skip).limit(limit).all()

def obtener_oferta(oferta_id: str, db: Session = Depends(get_db)):
    oferta = db.query(models.Oferta).filter(models.Oferta.id == oferta_id).first()
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return oferta

def actualizar_oferta(oferta_id: str, datos: dict, db: Session = Depends(get_db)):
    oferta = db.query(models.Oferta).filter(models.Oferta.id == oferta_id).first()
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    for key, value in datos.items():
        setattr(oferta, key, value)
    db.commit()
    return {"mensaje": "Oferta actualizada"}

def eliminar_oferta(oferta_id: str, db: Session = Depends(get_db)):
    oferta = db.query(models.Oferta).filter(models.Oferta.id == oferta_id).first()
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    db.delete(oferta)
    db.commit()
    return {"mensaje": "Oferta eliminada"}
