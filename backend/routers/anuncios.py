from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models
import uuid

router = APIRouter(prefix="/api/anuncios", tags=["Anuncios"])

# Dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=dict)
def crear_oferta(oferta: dict, db: Session = Depends(get_db)):
    # Assume anuncio dict contains required fields
    nuevo = models.Anuncio(id=str(uuid.uuid4()), **oferta)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Anuncio creado", "id": nuevo.id}

@router.get("/", response_model=None)
def listar_ofertas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Anuncio).offset(skip).limit(limit).all()

@router.get("/{anuncio_id}", response_model=None)
def obtener_oferta(anuncio_id: str, db: Session = Depends(get_db)):
    anuncio = db.query(models.Anuncio).filter(models.Anuncio.id == anuncio_id).first()
    if not anuncio:
        raise HTTPException(status_code=404, detail="Anuncio no encontrado")
    return anuncio

@router.put("/{anuncio_id}", response_model=dict)
def actualizar_oferta(anuncio_id: str, datos: dict, db: Session = Depends(get_db)):
    anuncio = db.query(models.Anuncio).filter(models.Anuncio.id == anuncio_id).first()
    if not anuncio:
        raise HTTPException(status_code=404, detail="Anuncio no encontrado")
    for key, value in datos.items():
        setattr(anuncio, key, value)
    db.commit()
    return {"mensaje": "Anuncio actualizado"}

@router.delete("/{anuncio_id}", response_model=dict)
def eliminar_oferta(anuncio_id: str, db: Session = Depends(get_db)):
    anuncio = db.query(models.Anuncio).filter(models.Anuncio.id == anuncio_id).first()
    if not anuncio:
        raise HTTPException(status_code=404, detail="Anuncio no encontrado")
    db.delete(anuncio)
    db.commit()
    return {"mensaje": "Anuncio eliminado"}
