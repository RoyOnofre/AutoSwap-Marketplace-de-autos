from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import uuid

router = APIRouter(prefix="/api/inspecciones", tags=["Inspecciones"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=dict)
def crear_inspeccion(inspeccion: dict, db: Session = Depends(get_db)):
    # Ensure an 'id' exists
    if not inspeccion.get("id"):
        inspeccion["id"] = str(uuid.uuid4())
    nuevo = models.Inspeccion(**inspeccion)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Inspección creada", "id": nuevo.id}

@router.get("/", response_model=None)
def listar_inspecciones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Inspeccion).offset(skip).limit(limit).all()

@router.get("/{inspeccion_id}", response_model=None)
def obtener_inspeccion(inspeccion_id: str, db: Session = Depends(get_db)):
    inspeccion = db.query(models.Inspeccion).filter(models.Inspeccion.id == inspeccion_id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    return inspeccion

@router.put("/{inspeccion_id}", response_model=dict)
def actualizar_inspeccion(inspeccion_id: str, datos: dict, db: Session = Depends(get_db)):
    inspeccion = db.query(models.Inspeccion).filter(models.Inspeccion.id == inspeccion_id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    for key, value in datos.items():
        setattr(inspeccion, key, value)
    db.commit()
    return {"mensaje": "Inspección actualizada"}

@router.delete("/{inspeccion_id}", response_model=dict)
def eliminar_inspeccion(inspeccion_id: str, db: Session = Depends(get_db)):
    inspeccion = db.query(models.Inspeccion).filter(models.Inspeccion.id == inspeccion_id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    db.delete(inspeccion)
    db.commit()
    return {"mensaje": "Inspección eliminada"}
