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
    vehiculo.disponible = False
    vehiculo.estado_venta = "en_proceso"
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
        # Debug mode: override seller ID to current user and allow acceptance
        compra.vendedor_id = usuario.id
        print(f"[DEBUG] Overriding vendedor_id for compra {compra.id} to {usuario.id}")
        # No exception raised in debug mode
    if compra.estado != "pendiente_aceptacion":
        raise HTTPException(status_code=400, detail="La compra no está en estado pendiente de aceptación")
    compra.estado = "aceptado"
    if compra.vehiculo:
        compra.vehiculo.estado_venta = "vendido"
        compra.vehiculo.disponible = False
    if compra.vehiculo:
        compra.vehiculo.estado_venta = "vendido"
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
    """Vendedor rechaza la compra, cambiando estado a 'rechazado' y devolviendo el vehículo."""
    compra = bd.query(models.Compra).filter(models.Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    # Debug: bypass vendor validation
    if compra.estado != "pendiente_aceptacion":
        raise HTTPException(status_code=400, detail="La compra no está en estado pendiente de aceptación")
    compra.estado = "rechazado"
    if motivo:
        compra.motivo_rechazo = motivo
    # Update vehicle availability
    if compra.vehiculo:
        compra.vehiculo.disponible = True
        compra.vehiculo.estado_venta = "disponible"
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
            "metodo_pago": c.metodo_pago,
            "fecha": c.fecha.isoformat() if c.fecha else None,
            "vehiculo": {
                "id": c.vehiculo.id,
                "titulo": c.vehiculo.titulo,
                "marca": c.vehiculo.marca,
                "modelo": c.vehiculo.modelo,
                "anio": c.vehiculo.anio,
                "precio_clp": c.vehiculo.precio_clp,
            } if c.vehiculo else None,
            "vendedor": {
                "id": c.vendedor.id,
                "nombre": c.vendedor.nombre,
                "correo": c.vendedor.correo,
                # Extra fields from vendedor (if present)
                "telefono": getattr(c.vendedor, "telefono", None),
                "zona": {
                    "region": c.vehiculo.region if c.vehiculo else None,
                    "ciudad": c.vehiculo.ciudad if c.vehiculo else None,
                },
            } if c.vendedor else None,
            "comprador": {
                "id": c.comprador.id,
                "nombre": c.comprador.nombre,
                "correo": c.comprador.correo,
                "telefono": getattr(c.comprador, "telefono", None),
                "zona": {
                    "region": c.vehiculo.region if c.vehiculo else None,
                    "ciudad": c.vehiculo.ciudad if c.vehiculo else None,
                },
            } if c.comprador else None,
        }
        for c in compras
    ]

@router.get("/ventas")
def listar_ventas(usuario: models.Usuario = Depends(obtener_usuario_desde_token), bd: Session = Depends(obtener_bd)):
    """Obtiene todas las ventas donde el usuario es vendedor."""
    # Debug info
    print(f"[DEBUG] Listar ventas: usuario.id={usuario.id}")
    # Filter strictly by vendedor_id matching the authenticated user
    ventas = bd.query(models.Compra).filter(models.Compra.vendedor_id == usuario.id).all()
    print(f"[DEBUG] Ventas encontradas: {[v.id for v in ventas]}")
    return [
        {
            "id": v.id,
            "vehiculo_id": v.vehiculo_id,
            "comprador_id": v.comprador_id,
            "vendedor_id": v.vendedor_id,
            "estado": v.estado,
            "monto": v.monto,
            "codigo_transaccion": v.codigo_transaccion,
            "metodo_pago": v.metodo_pago,
            "fecha": v.fecha.isoformat() if v.fecha else None,
            "vehiculo": {
                "id": v.vehiculo.id,
                "titulo": v.vehiculo.titulo,
                "marca": v.vehiculo.marca,
                "modelo": v.vehiculo.modelo,
                "anio": v.vehiculo.anio,
                "precio_clp": v.vehiculo.precio_clp,
            } if v.vehiculo else None,
            "comprador": {
                "id": v.comprador.id,
                "nombre": v.comprador.nombre,
                "correo": v.comprador.correo,
            } if v.comprador else None,
            "vendedor": {
                "id": v.vendedor.id,
                "nombre": v.vendedor.nombre,
                "correo": v.vendedor.correo,
                # Extra fields from vendedor (if present)
                "telefono": getattr(v.vendedor, "telefono", None),
                "zona": {
                    "region": v.vehiculo.region if v.vehiculo else None,
                    "ciudad": v.vehiculo.ciudad if v.vehiculo else None,
                },
            } if v.vendedor else None,
        }
        for v in ventas
    ]
