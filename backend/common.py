import os
import uuid
from typing import Optional
from fastapi import Header, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session
from database import SessionLocal
import models

SECRET_KEY = "autoswap-super-secret-key-for-sprint-2"
ALGORITHM = "HS256"

def obtener_bd():
    bd = SessionLocal()
    try:
        yield bd
    finally:
        bd.close()

def obtener_usuario_desde_token(authorization: Optional[str] = Header(None), bd: Session = Depends(obtener_bd)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado: Token faltante o formato inválido")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: str = payload.get("id")
        if usuario_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        usuario = bd.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return usuario
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

def registrar_auditoria(bd: Session, usuario_id: str, accion: str, descripcion: str):
    try:
        log = models.Auditoria(
            id=str(uuid.uuid4()),
            usuario_id=usuario_id,
            accion=accion,
            descripcion=descripcion
        )
        bd.add(log)
        bd.commit()
    except Exception as e:
        print(f"Error registrando auditoria: {e}")
        bd.rollback()

