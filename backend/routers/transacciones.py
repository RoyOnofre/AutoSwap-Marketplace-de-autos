from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import uuid
import datetime

from database import SessionLocal
import models
from common import obtener_usuario_desde_token, registrar_auditoria

router = APIRouter(prefix="/api/transacciones", tags=["transacciones"])

# Dependency to get DB session
def obtener_bd():
    bd = SessionLocal()
    try:
        yield bd
    finally:
        bd.close()

@router.post("/comprar/{vehiculo_id}")
def comprar_vehiculo(
    vehiculo_id: str,
    usuario: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd),
):
    # Debug logging
    print(f"[DEBUG] compra request: vehiculo_id={vehiculo_id}, user_id={usuario.id}")
    """Inicia una compra segura. Crea registro en tabla Compra con estado pendiente_aceptacion."""
    vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id, models.Vehiculo.es_activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if vehiculo.vendedor_id == usuario.id:
        raise HTTPException(status_code=400, detail="No puedes comprar tu propio vehículo")
    # Verify vehicle is approved for sale
    if vehiculo.estado_validacion != "aprobado":
        raise HTTPException(status_code=400, detail="El vehículo no está aprobado para la venta")
    # Create Compra record
    compra = models.Compra(
        id=str(uuid.uuid4()),
        comprador_id=usuario.id,
        vehiculo_id=vehiculo.id,
        vendedor_id=vehiculo.vendedor_id,
        metodo_pago="pendiente",  # frontend will definir método después
        codigo_transaccion=str(uuid.uuid4()),
        monto=vehiculo.precio_clp,
        estado="pendiente_aceptacion",
    )
    bd.add(compra)
    bd.commit()
    bd.refresh(compra)
    registrar_auditoria(bd, usuario.id, "COMPRA_INICIADA", f"Compra {compra.id} iniciada por {usuario.id}")
    return {
        "id": compra.id,
        "estado": compra.estado,
        "codigo_transaccion": compra.codigo_transaccion,
        "monto": compra.monto,
    }

@router.post("/{compra_id}/aceptar")
def aceptar_compra(
    compra_id: str,
    usuario: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd),
):
    """Vendedor acepta la compra, cambiando estado a 'aceptado'."""
    compra = bd.query(models.Compra).filter(models.Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if compra.vendedor_id != usuario.id:
        raise HTTPException(status_code=403, detail="Solo el vendedor puede aceptar la compra")
    if compra.estado != "pendiente_aceptacion":
        raise HTTPException(status_code=400, detail="La compra no está en estado pendiente de aceptación")
    compra.estado = "aceptado"
    bd.commit()
    registrar_auditoria(bd, usuario.id, "COMPRA_ACEPTADA", f"Compra {compra.id} aceptada por vendedor {usuario.id}")
    return {"mensaje": "Compra aceptada", "id": compra.id, "estado": compra.estado}

@router.post("/{compra_id}/rechazar")
def rechazar_compra(
    compra_id: str,
    motivo: str = None,
    usuario: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd),
):
    """Vendedor rechaza la compra, cambiando estado a 'rechazado'."""
    compra = bd.query(models.Compra).filter(models.Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if compra.vendedor_id != usuario.id:
        raise HTTPException(status_code=403, detail="Solo el vendedor puede rechazar la compra")
    if compra.estado != "pendiente_aceptacion":
        raise HTTPException(status_code=400, detail="La compra no está en estado pendiente de aceptación")
    compra.estado = "rechazado"
    if motivo:
        compra.motivo_rechazo = motivo
    bd.commit()
    registrar_auditoria(bd, usuario.id, "COMPRA_RECHAZADA", f"Compra {compra.id} rechazada por vendedor {usuario.id}")
    return {"mensaje": "Compra rechazada", "id": compra.id, "estado": compra.estado}

@router.get("/compras")
def listar_compras(usuario: models.Usuario = Depends(obtener_usuario_desde_token), bd: Session = Depends(obtener_bd)):
    """Obtiene todas las compras donde el usuario es comprador."""
    compras = bd.query(models.Compra).filter(models.Compra.comprador_id == usuario.id).all()
    return [
        {
            "id": c.id,
            "vehiculo_id": c.vehiculo_id,
            "vendedor_id": c.vendedor_id,
            "estado": c.estado,
            "monto": c.monto,
            "codigo_transaccion": c.codigo_transaccion,
        }
        for c in compras
    ]

@router.get("/ventas")

def listar_ventas(usuario: models.Usuario = Depends(obtener_usuario_desde_token), bd: Session = Depends(obtener_bd)):

    """Obtiene todas las ventas donde el usuario es vendedor."""
    ventas = bd.query(models.Compra).filter(models.Compra.vendedor_id == usuario.id).all()
    return [
        {
            "id": v.id,
            "vehiculo_id": v.vehiculo_id,
            "comprador_id": v.comprador_id,
            "estado": v.estado,
            "monto": v.monto,
            "codigo_transaccion": v.codigo_transaccion,
        }
        for v in ventas
    ]
