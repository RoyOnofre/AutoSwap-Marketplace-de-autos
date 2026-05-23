from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import uuid
import datetime
from passlib.context import CryptContext
from pydantic import BaseModel
from . import models
from .database import SessionLocal, engine
from .routers import anuncios, ofertas, inspecciones

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verificar_contrasena(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def obtener_hash_contrasena(password):
    return pwd_context.hash(password)

models.Base.metadata.create_all(bind=engine)

# Asegurar migración para kyc_estado
with engine.connect() as connection:
    try:
        from sqlalchemy import text
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS kyc_estado VARCHAR DEFAULT 'Pendiente';"))
        connection.commit()
        print("[OK] Columna 'kyc_estado' verificada/agregada.")
    except Exception as e:
        print(f"[INFO] No se pudo alterar la tabla usuarios: {e}")

# Helper para Auditoria
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

app = FastAPI(title="TechStore Manager API Master - Español")
app.include_router(anuncios.router)
app.include_router(ofertas.router)
app.include_router(inspecciones.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def obtener_bd():
    bd = SessionLocal()
    try:
        yield bd
    finally:
        bd.close()

# ─────────────────────────────────────────────
# MODELOS PYDANTIC
# ─────────────────────────────────────────────
class CrearUsuario(BaseModel):
    nombre: str
    correo: str
    contrasena: str
    rol: str

class PeticionLogin(BaseModel):
    correo: str
    contrasena: str

class ActualizarUsuario(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    rol: Optional[str] = None
    estado: Optional[str] = None
    kyc_estado: Optional[str] = None
    nueva_contrasena: Optional[str] = None

class ResetContrasena(BaseModel):
    correo: str
    nueva_contrasena: str

class CrearProducto(BaseModel):
    nombre: str
    sku: str
    categoria: str
    precio: float
    stock: int
    imagen: str = "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"
    estado: str = "En Stock"

class CrearCliente(BaseModel):
    nombre: str
    correo: str
    telefono: str
    nit_rfc: str
    direccion: str

class DetalleVentaPydantic(BaseModel):
    producto_id: str
    cantidad: int
    precio_unitario: float
    numero_serie: str = None

class CrearVenta(BaseModel):
    cliente_id: str = None
    metodo_pago: str
    usuario_id: str 
    detalles: list[DetalleVentaPydantic]

# ─────────────────────────────────────────────
# HELPER — Serializar usuario de forma segura
# ─────────────────────────────────────────────
def serializar_usuario(u: models.Usuario) -> dict:
    ultimo = None
    if u.ultimo_login:
        delta = datetime.datetime.utcnow() - u.ultimo_login
        minutos = int(delta.total_seconds() // 60)
        if minutos < 1:
            ultimo = "Hace un momento"
        elif minutos < 60:
            ultimo = f"Hace {minutos} min"
        elif minutos < 1440:
            horas = minutos // 60
            ultimo = f"Hace {horas} hora{'s' if horas > 1 else ''}"
        else:
            dias = minutos // 1440
            ultimo = f"Hace {dias} día{'s' if dias > 1 else ''}"
    else:
        ultimo = "Nunca"

    return {
        "id": u.id,
        "nombre": u.nombre,
        "correo": u.correo,
        "rol": u.rol,
        "estado": u.estado,
        "kyc_estado": u.kyc_estado if hasattr(u, 'kyc_estado') else "Pendiente",
        "iniciales": u.iniciales,
        "avatar": u.avatar,
        "ultimo_login": ultimo,
    }

# ─────────────────────────────────────────────
# RUTAS DE AUTENTICACIÓN
# ─────────────────────────────────────────────
@app.post("/api/auth/registro")
def registrar_usuario(usuario: CrearUsuario, bd: Session = Depends(obtener_bd)):
    # Verificar si el correo ya está registrado
    if bd.query(models.Usuario).filter(models.Usuario.correo == usuario.correo).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    nuevo_usuario = models.Usuario(
        id=str(uuid.uuid4()),
        nombre=usuario.nombre,
        correo=usuario.correo,
        contrasena_encriptada=obtener_hash_contrasena(usuario.contrasena),
        rol=usuario.rol,
        estado="Activo",
        iniciales="".join([n[0] for n in usuario.nombre.split()]).upper()[:2]
    )
    bd.add(nuevo_usuario)
    bd.commit()
    bd.refresh(nuevo_usuario)
    # Auditoría
    registrar_auditoria(bd, nuevo_usuario.id, "CREAR", f"Usuario {nuevo_usuario.nombre} registrado.")
    return {"mensaje": "Usuario registrado exitosamente", "id": nuevo_usuario.id}


@app.post("/api/auth/login")
def login(peticion: PeticionLogin, bd: Session = Depends(obtener_bd)):
    usuario = bd.query(models.Usuario).filter(models.Usuario.correo == peticion.correo).first()
    if not usuario:
        print(f"[AUTH FAIL] Usuario no encontrado: {peticion.correo}")
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    if not verificar_contrasena(peticion.contrasena, usuario.contrasena_encriptada):
        print(f"[AUTH FAIL] Contraseña incorrecta para: {peticion.correo}")
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if usuario.estado == "Inactivo":
        print(f"[AUTH FAIL] Usuario inactivo: {peticion.correo}")
        raise HTTPException(status_code=403, detail="Tu cuenta está desactivada. Contacta al administrador.")
    
    # Actualizar último login
    usuario.ultimo_login = datetime.datetime.utcnow()
    bd.commit()
    
    # Audit log
    registrar_auditoria(bd, usuario.id, "LOGIN", "Inicio de sesión exitoso.")
    print(f"[AUTH SUCCESS] Usuario autenticado: {usuario.correo}")
    
    return {
        "mensaje": "Login exitoso",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "iniciales": usuario.iniciales,
            "estado": usuario.estado,
        }
    }

# ─────────────────────────────────────────────
# RUTAS DE GESTIÓN DE USUARIOS (CRUD COMPLETO)
# ─────────────────────────────────────────────

@app.get("/api/usuarios")
def obtener_usuarios(
    buscar: Optional[str] = None,
    rol: Optional[str] = None,
    estado: Optional[str] = None,
    bd: Session = Depends(obtener_bd)
):
    """Lista todos los usuarios con filtros opcionales de búsqueda, rol y estado."""
    query = bd.query(models.Usuario)
    
    if buscar:
        termino = f"%{buscar}%"
        query = query.filter(
            or_(
                models.Usuario.nombre.ilike(termino),
                models.Usuario.correo.ilike(termino)
            )
        )
    if rol and rol != "todos":
        query = query.filter(models.Usuario.rol == rol)
    if estado and estado != "todos":
        query = query.filter(models.Usuario.estado == estado)
    
    usuarios = query.all()
    return [serializar_usuario(u) for u in usuarios]

@app.get("/api/usuarios/{usuario_id}")
def obtener_usuario(usuario_id: str, bd: Session = Depends(obtener_bd)):
    """Obtiene un usuario por su ID."""
    usuario = bd.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return serializar_usuario(usuario)

@app.put("/api/usuarios/{usuario_id}")
def actualizar_usuario(usuario_id: str, datos: ActualizarUsuario, bd: Session = Depends(obtener_bd)):
    """Edita nombre, correo, rol, estado o contraseña de un usuario."""
    usuario = bd.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar correo duplicado si se cambia
    if datos.correo and datos.correo != usuario.correo:
        if bd.query(models.Usuario).filter(models.Usuario.correo == datos.correo).first():
            raise HTTPException(status_code=400, detail="Ese correo ya está en uso por otro usuario")
    
    if datos.nombre is not None:
        usuario.nombre = datos.nombre
        usuario.iniciales = "".join([n[0] for n in datos.nombre.split()]).upper()[:2]
    if datos.correo is not None:
        usuario.correo = datos.correo
    if datos.rol is not None:
        usuario.rol = datos.rol
    if datos.estado is not None:
        usuario.estado = datos.estado
    if datos.kyc_estado is not None:
        usuario.kyc_estado = datos.kyc_estado
    if datos.nueva_contrasena is not None:
        if len(datos.nueva_contrasena) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        usuario.contrasena_encriptada = obtener_hash_contrasena(datos.nueva_contrasena)
    
    bd.commit()
    bd.refresh(usuario)
    
    # Audit log
    registrar_auditoria(bd, usuario_id, "EDITAR", f"Usuario {usuario.nombre} actualizado.")
    
    return {"mensaje": "Usuario actualizado exitosamente", "usuario": serializar_usuario(usuario)}

@app.patch("/api/usuarios/{usuario_id}/estado")
def cambiar_estado_usuario(usuario_id: str, bd: Session = Depends(obtener_bd)):
    """Alterna el estado de un usuario entre Activo e Inactivo."""
    usuario = bd.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.estado = "Inactivo" if usuario.estado == "Activo" else "Activo"
    bd.commit()
    
    # Audit log
    registrar_auditoria(bd, usuario_id, "ESTADO", f"Estado de {usuario.nombre} cambiado a {usuario.estado}.")
    
    return {"mensaje": f"Usuario {usuario.estado.lower()} exitosamente", "estado": usuario.estado}

@app.delete("/api/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: str, bd: Session = Depends(obtener_bd)):
    """
    Elimina un usuario del sistema. 
    Borra automáticamente sus registros de auditoría para permitir la eliminación,
    pero bloquea si tiene ventas o movimientos de inventario.
    """
    try:
        usuario = bd.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # 1. Bloqueo estricto por Ventas (Integridad de Facturación)
        ventas_count = bd.query(models.Venta).filter(models.Venta.usuario_id == usuario_id).count()
        if ventas_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: el usuario tiene {ventas_count} venta(s). Usa 'Desactivar' para mantener el historial legal."
            )
        
        # 2. Bloqueo por Movimientos de Inventario (Integridad de Stock)
        movimientos_count = bd.query(models.MovimientoInventario).filter(models.MovimientoInventario.usuario_id == usuario_id).count()
        if movimientos_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: tiene {movimientos_count} movimientos de stock asociados. Desactívalo."
            )

        nombre_borrado = usuario.nombre
        
        # 3. Limpieza automática de Auditoría (Logs de actividad)
        # Borramos sus logs para que no impidan el borrado del usuario (FK)
        bd.query(models.Auditoria).filter(models.Auditoria.usuario_id == usuario_id).delete()

        # 4. Registrar la eliminación en la auditoría general (sin referencia al usuario borrado)
        registrar_auditoria(bd, None, "ELIMINAR", f"El usuario '{nombre_borrado}' fue eliminado permanentemente del sistema.")

        # 5. Borrar el usuario y confirmar
        bd.delete(usuario)
        bd.commit()
        
        return {"mensaje": f"Usuario {nombre_borrado} eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        bd.rollback()
        print(f"Error en eliminar_usuario: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/api/auth/reset-contrasena")
def reset_contrasena(datos: ResetContrasena, bd: Session = Depends(obtener_bd)):
    """Restablece la contraseña de un usuario por su correo."""
    usuario = bd.query(models.Usuario).filter(models.Usuario.correo == datos.correo).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="No existe ningún usuario con ese correo")
    if len(datos.nueva_contrasena) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    usuario.contrasena_encriptada = obtener_hash_contrasena(datos.nueva_contrasena)
    bd.commit()
    return {"mensaje": "Contraseña restablecida exitosamente"}

# ─────────────────────────────────────────────
# RUTAS DE PRODUCTOS
# ─────────────────────────────────────────────
@app.get("/api/productos")
def obtener_productos(bd: Session = Depends(obtener_bd)):
    return bd.query(models.Producto).all()

@app.post("/api/productos")
def crear_producto(producto: CrearProducto, bd: Session = Depends(obtener_bd)):
    nuevo_producto = models.Producto(id=str(uuid.uuid4()), **producto.dict())
    bd.add(nuevo_producto)
    bd.commit()
    return nuevo_producto

# ─────────────────────────────────────────────
# RUTAS DE CLIENTES
# ─────────────────────────────────────────────
@app.get("/api/clientes")
def obtener_clientes(bd: Session = Depends(obtener_bd)):
    return bd.query(models.Cliente).all()

@app.post("/api/clientes")
def crear_cliente(cliente: CrearCliente, bd: Session = Depends(obtener_bd)):
    nuevo_cliente = models.Cliente(id=str(uuid.uuid4()), **cliente.dict())
    bd.add(nuevo_cliente)
    bd.commit()
    return nuevo_cliente

# ─────────────────────────────────────────────
# RUTAS DE VENTAS — LÓGICA AVANZADA
# ─────────────────────────────────────────────
@app.post("/api/ventas")
def crear_venta(venta: CrearVenta, bd: Session = Depends(obtener_bd)):
    TASA_IMPUESTO = 0.16
    subtotal_real = 0
    cantidad_articulos = 0
    venta_id = str(uuid.uuid4())
    detalles_db = []
    
    for item in venta.detalles:
        producto = bd.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
        if not producto or producto.stock < item.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {producto.nombre if producto else 'producto no encontrado'}")
        
        producto.stock -= item.cantidad
        movimiento = models.MovimientoInventario(
            id=str(uuid.uuid4()), tipo="SALIDA", cantidad=item.cantidad, 
            motivo=f"Venta {venta_id}", producto_id=producto.id, usuario_id=venta.usuario_id
        )
        bd.add(movimiento)
        
        subtotal_item = item.cantidad * producto.precio
        subtotal_real += subtotal_item
        cantidad_articulos += item.cantidad
        
        detalles_db.append(models.DetalleVenta(
            venta_id=venta_id, producto_id=producto.id, cantidad=item.cantidad,
            precio_unitario=producto.precio, subtotal=subtotal_item, numero_serie=item.numero_serie
        ))
        
    monto_impuesto = subtotal_real * TASA_IMPUESTO
    monto_total = subtotal_real + monto_impuesto

    nueva_venta = models.Venta(
        id=venta_id, cliente_id=venta.cliente_id, usuario_id=venta.usuario_id,
        subtotal=subtotal_real, impuesto=monto_impuesto, total=monto_total,
        cantidad_articulos=cantidad_articulos, metodo_pago=venta.metodo_pago
    )
    bd.add(nueva_venta)
    for det in detalles_db:
        bd.add(det)
        
    bd.commit()
    return {"mensaje": "Venta procesada exitosamente con descuento automático de stock", "venta_id": venta_id}

@app.get("/api/reportes/ventas/pdf")
def descargar_pdf_ventas(bd: Session = Depends(obtener_bd)):
    ventas = bd.query(models.Venta).all()
    if not ventas:
        raise HTTPException(status_code=404, detail="No hay ventas")
    ruta_pdf = generar_pdf_ventas(ventas)
    return FileResponse(path=ruta_pdf, filename="Ventas_TechStore.pdf", media_type="application/pdf")

@app.get("/api/reportes/usuarios/pdf")
def descargar_pdf_usuarios(bd: Session = Depends(obtener_bd)):
    """Genera y descarga un reporte PDF con todos los usuarios registrados."""
    usuarios = bd.query(models.Usuario).all()
    if not usuarios:
        raise HTTPException(status_code=404, detail="No hay usuarios")
    ruta_pdf = generar_pdf_usuarios(usuarios)
    return FileResponse(path=ruta_pdf, filename="Usuarios_TechStore.pdf", media_type="application/pdf")

@app.get("/api/auditoria")
def obtener_auditoria(bd: Session = Depends(obtener_bd)):
    """Obtiene los últimos 50 registros de auditoría."""
    logs = bd.query(models.Auditoria).order_by(models.Auditoria.fecha.desc()).limit(50).all()
    return [{
        "id": l.id,
        "usuario": l.usuario.nombre if l.usuario else "Sistema",
        "accion": l.accion,
        "descripcion": l.descripcion,
        "fecha": l.fecha.strftime("%d/%m/%Y %H:%M")
    } for l in logs]

if __name__ == "__main__":
    import uvicorn
    print("Servidor MASTER API iniciado en http://localhost:8004")
    uvicorn.run(app, host="0.0.0.0", port=8004)
