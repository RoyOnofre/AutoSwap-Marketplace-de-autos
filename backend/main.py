from fastapi import FastAPI, Depends, HTTPException, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from jose import jwt

SECRET_KEY = "autoswap-super-secret-key-for-sprint-2"
ALGORITHM = "HS256"

def crear_token_acceso(datos: dict):
    para_encriptar = datos.copy()
    return jwt.encode(para_encriptar, SECRET_KEY, algorithm=ALGORITHM)
import uuid
import datetime
from passlib.context import CryptContext
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
import models
from database import SessionLocal, engine
from routers import anuncios, ofertas, inspecciones

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
        connection.execute(text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_anuncio') THEN
                CREATE TYPE estado_anuncio AS ENUM ('pendiente', 'aprobado', 'rechazado');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_vehiculo') THEN
                CREATE TYPE categoria_vehiculo AS ENUM ('sedan', 'suv', 'hatchback', 'pickup', 'van', 'otro');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_combustible') THEN
                CREATE TYPE tipo_combustible AS ENUM ('gasolina', 'diesel', 'electrico', 'hibrido');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_transmision') THEN
                CREATE TYPE tipo_transmision AS ENUM ('manual', 'automatico');
            END IF;
        END $$;
        """))
        connection.commit()
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS kyc_estado VARCHAR DEFAULT 'Pendiente';"))
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;"))
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'Español (Bolivia)';"))
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT '(GMT-04:00) La Paz';"))
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor BOOLEAN DEFAULT FALSE;"))
        connection.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar VARCHAR;"))
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
    bio: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    two_factor: Optional[bool] = None
    avatar: Optional[str] = None

class ResetContrasena(BaseModel):
    correo: str
    nueva_contrasena: str

class CrearFotoVehiculo(BaseModel):
    ruta_almacenamiento: str
    etiqueta_angulo: str
    es_primaria: Optional[bool] = False
    orden_visualizacion: Optional[int] = 0

class CrearCaracteristicaVehiculo(BaseModel):
    clave_caracteristica: str
    etiqueta_caracteristica: str
    categoria: str

class CrearVehiculoPydantic(BaseModel):
    titulo: str
    descripcion: str
    marca: str
    modelo: str
    anio: int
    kilometraje_km: int
    precio_clp: int
    categoria: str
    tipo_combustible: str
    transmision: str
    color_exterior: Optional[str] = None
    patente: Optional[str] = None
    region: str
    ciudad: str
    fotos: Optional[List[CrearFotoVehiculo]] = []
    caracteristicas: Optional[List[CrearCaracteristicaVehiculo]] = []

class ActualizarVehiculoPydantic(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    kilometraje_km: Optional[int] = None
    precio_clp: Optional[int] = None
    categoria: Optional[str] = None
    tipo_combustible: Optional[str] = None
    transmision: Optional[str] = None
    color_exterior: Optional[str] = None
    patente: Optional[str] = None
    region: Optional[str] = None
    ciudad: Optional[str] = None
    fotos: Optional[List[CrearFotoVehiculo]] = None
    caracteristicas: Optional[List[CrearCaracteristicaVehiculo]] = None

class ValidarAnuncioAnuncio(BaseModel):
    accion: str
    motivo: Optional[str] = None

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
        "bio": getattr(u, 'bio', ''),
        "language": getattr(u, 'language', 'Español (Bolivia)'),
        "timezone": getattr(u, 'timezone', '(GMT-04:00) La Paz'),
        "two_factor": getattr(u, 'two_factor', False),
        "ultimo_login": ultimo,
    }

# ─────────────────────────────────────────────
# RUTAS DE AUTENTICACIÓN
# ─────────────────────────────────────────────
@app.post("/api/auth/registro")
def registrar_usuario(usuario: CrearUsuario, bd: Session = Depends(obtener_bd)):
    # Note: extra parenthesis removed; function signature now correct
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
    # Fixed extra parenthesis in login signature
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
    
    token = crear_token_acceso({"id": usuario.id, "rol": usuario.rol, "correo": usuario.correo})
    
    return {
        "mensaje": "Login exitoso",
        "token": token,
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
    """Edita nombre, correo, rol, estado, KYC, bio, idioma, zona horaria y 2FA del usuario."""
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
    if datos.bio is not None:
        usuario.bio = datos.bio
    if datos.language is not None:
        usuario.language = datos.language
    if datos.timezone is not None:
        usuario.timezone = datos.timezone
    if datos.avatar is not None:
        usuario.avatar = datos.avatar
    if datos.two_factor is not None:
        usuario.two_factor = datos.two_factor
    if datos.nueva_contrasena is not None:
        if len(datos.nueva_contrasena) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        usuario.contrasena_encriptada = obtener_hash_contrasena(datos.nueva_contrasena)
    bd.commit()
    bd.refresh(usuario)
    registrar_auditoria(bd, usuario_id, "EDITAR", f"Usuario {usuario.nombre} actualizado.")
    return {"mensaje": "Usuario actualizado exitosamente", "usuario": serializar_usuario(usuario)}

# Duplicate block removed

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

# Duplicate block removed

@app.delete("/api/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: str, bd: Session = Depends(obtener_bd)):

    # Fixed extra parenthesis
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
        # Log the error and continue
        print(f"Error processing purchase: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/api/auth/reset-contrasena")
def reset_contrasena(datos: ResetContrasena, bd: Session = Depends(obtener_bd)):
    # Fixed extra parenthesis
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
def obtener_productos(bd: Session = Depends(obtener_bd)):
    # Fixed extra parenthesis
    return bd.query(models.Producto).all()

def crear_producto(producto: CrearProducto, bd: Session = Depends(obtener_bd)):
    # Fixed extra parenthesis
    nuevo_producto = models.Producto(id=str(uuid.uuid4()), **producto.dict())
    bd.add(nuevo_producto)
    bd.commit()
    return nuevo_producto

# ─────────────────────────────────────────────
# RUTAS DE CLIENTES
# ─────────────────────────────────────────────
def obtener_clientes(bd: Session = Depends(obtener_bd)):
    # Fixed extra parenthesis
    return bd.query(models.Cliente).all()

def crear_cliente(cliente: CrearCliente, bd: Session = Depends(obtener_bd)):
    # Fixed extra parenthesis
    nuevo_cliente = models.Cliente(id=str(uuid.uuid4()), **cliente.dict())
    bd.add(nuevo_cliente)
    bd.commit()
    return nuevo_cliente

# ─────────────────────────────────────────────
# RUTAS DE VENTAS — LÓGICA AVANZADA
# ─────────────────────────────────────────────
def crear_venta(venta: CrearVenta, bd: Session = Depends(obtener_bd)):
    # Fixed extra parenthesis
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

# ─────────────────────────────────────────────
# SPRINT 2 — ENDPOINTS DE VEHÍCULOS
# ─────────────────────────────────────────────

@app.post("/api/vehiculos")
def registrar_vehiculo(
    datos: CrearVehiculoPydantic,
    vendedor: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd)
):
    if vendedor.rol not in ["vendedor", "admin"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes: Solo vendedores o administradores pueden publicar vehículos")
    
    if len(datos.titulo) > 150:
        raise HTTPException(status_code=400, detail="El título no puede superar los 150 caracteres")
    if len(datos.descripcion) < 100:
        raise HTTPException(status_code=400, detail="La descripción debe contener un mínimo de 100 caracteres")
    if datos.anio < 1990:
        raise HTTPException(status_code=400, detail="El año debe ser igual o superior a 1990")
    if datos.kilometraje_km < 0:
        raise HTTPException(status_code=400, detail="El kilometraje no puede ser negativo")
    if datos.precio_clp <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser superior a 0")

    # Crear entidad de vehículo
    nuevo_vehiculo = models.Vehiculo(
        id=str(uuid.uuid4()),
        vendedor_id=vendedor.id,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        marca=datos.marca,
        modelo=datos.modelo,
        anio=datos.anio,
        kilometraje_km=datos.kilometraje_km,
        precio_clp=datos.precio_clp,
        categoria=datos.categoria,
        tipo_combustible=datos.tipo_combustible,
        transmision=datos.transmision,
        color_exterior=datos.color_exterior,
        patente=datos.patente,
        region=datos.region,
        ciudad=datos.ciudad,
        estado_validacion="aprobado",
        es_activo=True
    )
    bd.add(nuevo_vehiculo)

    # Insertar fotos
    if datos.fotos:
        for foto in datos.fotos:
            nueva_foto = models.FotoVehiculo(
                id=str(uuid.uuid4()),
                vehiculo_id=nuevo_vehiculo.id,
                ruta_almacenamiento=foto.ruta_almacenamiento,
                etiqueta_angulo=foto.etiqueta_angulo,
                es_primaria=foto.es_primaria,
                orden_visualizacion=foto.orden_visualizacion
            )
            bd.add(nueva_foto)

    # Insertar equipamiento/características
    if datos.caracteristicas:
        for char in datos.caracteristicas:
            nueva_char = models.CaracteristicaVehiculo(
                id=str(uuid.uuid4()),
                vehiculo_id=nuevo_vehiculo.id,
                clave_caracteristica=char.clave_caracteristica,
                etiqueta_caracteristica=char.etiqueta_caracteristica,
                categoria=char.categoria
            )
            bd.add(nueva_char)

    bd.commit()
    bd.refresh(nuevo_vehiculo)
    registrar_auditoria(bd, vendedor.id, "CREAR", f"Vehículo '{nuevo_vehiculo.marca} {nuevo_vehiculo.modelo}' registrado.")
    
    return {"mensaje": "Vehículo registrado exitosamente", "id": nuevo_vehiculo.id}


@app.put("/api/vehiculos/{vehiculo_id}")
def actualizar_vehiculo(
    vehiculo_id: str,
    datos: ActualizarVehiculoPydantic,
    usuario: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd)
):
    vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id, models.Vehiculo.es_activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    if usuario.rol != "admin" and vehiculo.vendedor_id != usuario.id:
        raise HTTPException(status_code=403, detail="No autorizado para editar este vehículo")

    # Actualizar campos simples si se proporcionan
    for campo, valor in datos.dict(exclude_unset=True).items():
        if campo not in ["fotos", "caracteristicas"] and valor is not None:
            setattr(vehiculo, campo, valor)

    # Re-validar si cambia título o descripción
    if datos.titulo and len(datos.titulo) > 150:
        raise HTTPException(status_code=400, detail="El título no puede superar los 150 caracteres")
    if datos.descripcion and len(datos.descripcion) < 100:
        raise HTTPException(status_code=400, detail="La descripción debe contener un mínimo de 100 caracteres")

    # Si se actualizan fotos
    if datos.fotos is not None:
        # Limpiar anteriores
        bd.query(models.FotoVehiculo).filter(models.FotoVehiculo.vehiculo_id == vehiculo.id).delete()
        for foto in datos.fotos:
            nueva_foto = models.FotoVehiculo(
                id=str(uuid.uuid4()),
                vehiculo_id=vehiculo.id,
                ruta_almacenamiento=foto.ruta_almacenamiento,
                etiqueta_angulo=foto.etiqueta_angulo,
                es_primaria=foto.es_primaria,
                orden_visualizacion=foto.orden_visualizacion
            )
            bd.add(nueva_foto)

    # Si se actualiza equipamiento
    if datos.caracteristicas is not None:
        # Limpiar anteriores
        bd.query(models.CaracteristicaVehiculo).filter(models.CaracteristicaVehiculo.vehiculo_id == vehiculo.id).delete()
        for char in datos.caracteristicas:
            nueva_char = models.CaracteristicaVehiculo(
                id=str(uuid.uuid4()),
                vehiculo_id=vehiculo.id,
                clave_caracteristica=char.clave_caracteristica,
                etiqueta_caracteristica=char.etiqueta_caracteristica,
                categoria=char.categoria
            )
            bd.add(nueva_char)

    bd.commit()
    bd.refresh(vehiculo)
    registrar_auditoria(bd, usuario.id, "EDITAR", f"Vehículo '{vehiculo.marca} {vehiculo.modelo}' actualizado.")
    return {"mensaje": "Vehículo actualizado exitosamente"}


@app.delete("/api/vehiculos/{vehiculo_id}")
def eliminar_vehiculo(
    vehiculo_id: str,
    usuario: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd)
):
    vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id, models.Vehiculo.es_activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    if usuario.rol != "admin" and vehiculo.vendedor_id != usuario.id:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar este vehículo")

    # Borrado lógico
    vehiculo.es_activo = False
    vehiculo.eliminado_at = datetime.datetime.utcnow()
    bd.commit()
    
    registrar_auditoria(bd, usuario.id, "ELIMINAR", f"Vehículo '{vehiculo.marca} {vehiculo.modelo}' borrado de forma lógica.")
    return {"mensaje": "Vehículo eliminado exitosamente"}


@app.get("/api/vehiculos")
def listar_vehiculos(
    buscar: Optional[str] = None,
    marca: Optional[str] = None,
    modelo: Optional[str] = None,
    categoria: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    bd: Session = Depends(obtener_bd)
):
    es_autorizado = False
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            rol = payload.get("rol")
            if rol in ["admin", "inspector"]:
                es_autorizado = True
        except Exception:
            pass

    query = bd.query(models.Vehiculo).filter(models.Vehiculo.es_activo == True)
    if not es_autorizado:
        query = query.filter(models.Vehiculo.estado_validacion == "aprobado")

    if buscar:
        termino = f"%{buscar}%"
        query = query.filter(
            or_(
                models.Vehiculo.titulo.ilike(termino),
                models.Vehiculo.descripcion.ilike(termino),
                models.Vehiculo.marca.ilike(termino),
                models.Vehiculo.modelo.ilike(termino)
            )
        )
    if marca:
        query = query.filter(models.Vehiculo.marca.ilike(marca))
    if modelo:
        query = query.filter(models.Vehiculo.modelo.ilike(modelo))
    if categoria:
        query = query.filter(models.Vehiculo.categoria == categoria)

    vehiculos = query.all()
    resultado = []
    for v in vehiculos:
        resultado.append({
            "id": v.id,
            "titulo": v.titulo,
            "marca": v.marca,
            "modelo": v.modelo,
            "precio_clp": v.precio_clp,
            "ciudad": v.ciudad,
            "estado_validacion": v.estado_validacion,
            "motivo_rechazo": v.motivo_rechazo,
            "es_activo": v.es_activo,
            "creado_at": v.creado_at.isoformat() if v.creado_at else None,
            "actualizado_at": v.actualizado_at.isoformat() if v.actualizado_at else None,
            "fotos": [{
                "id": f.id,
                "ruta_almacenamiento": f.ruta_almacenamiento,
                "etiqueta_angulo": f.etiqueta_angulo,
                "es_primaria": f.es_primaria,
                "orden_visualizacion": f.orden_visualizacion
            } for f in v.fotos],
            "caracteristicas": [{
                "id": c.id,
                "clave_caracteristica": c.clave_caracteristica,
                "etiqueta_caracteristica": c.etiqueta_caracteristica,
                "categoria": c.categoria
            } for c in v.caracteristicas]
        })
    return resultado


@app.patch("/api/vehiculos/{vehiculo_id}/validacion")
def validar_vehiculo(
    vehiculo_id: str,
    datos: ValidarAnuncioAnuncio,
    revisor: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd)
):
    if revisor.rol not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes: Solo administradores o inspectores pueden validar anuncios")

    vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id, models.Vehiculo.es_activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    if datos.accion not in ["aprobado", "rechazado", "reiniciado_a_pendiente"]:
        raise HTTPException(status_code=400, detail="Acción de validación inválida")

    if datos.accion == "rechazado" and not datos.motivo:
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")

    estado_anterior = vehiculo.estado_validacion
    
    # Mapear acción a estado
    estado_nuevo = "pendiente"
    if datos.accion == "aprobado":
        estado_nuevo = "aprobado"
    elif datos.accion == "rechazado":
        estado_nuevo = "rechazado"

    # Actualizar estado de validación en el vehículo
    vehiculo.estado_validacion = estado_nuevo
    vehiculo.motivo_rechazo = datos.motivo if datos.accion == "rechazado" else None
    vehiculo.revisado_por = revisor.id
    vehiculo.revisado_at = datetime.datetime.utcnow()


@app.put("/api/vehiculos/{vehiculo_id}/aprobar")
def aprobar_vehiculo(
    vehiculo_id: str,
    usuario: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd)
):
    # Only admin or inspector can approve
    if usuario.rol not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes: Sólo administradores o inspectores pueden aprobar vehículos")
    vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id, models.Vehiculo.es_activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    vehiculo.estado_validacion = "aprobado"
    vehiculo.revisado_por = usuario.id
    vehiculo.revisado_at = datetime.datetime.utcnow()
    bd.commit()
    bd.refresh(vehiculo)
    registrar_auditoria(bd, usuario.id, "APROBAR", f"Vehículo '{vehiculo.marca} {vehiculo.modelo}' aprobado manualmente.")
    return {"mensaje": "Vehículo aprobado exitosamente", "id": vehiculo.id}


# Endpoint for processing vehicle purchase transaction
# Duplicate purchase endpoint removed - original implementation retained above
async def comprar_vehiculo(
    vehiculo_id: str,
    request: Request,
    comprador: models.Usuario = Depends(obtener_usuario_desde_token),
    bd: Session = Depends(obtener_bd)
):
    """
    Process a vehicle purchase.
    Expects a JSON body with the selected payment method.
    """
    # Validate role
    if comprador.rol != "comprador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Permisos insuficientes: Solo los usuarios con rol 'comprador' pueden adquirir vehículos.")

    # Find active vehicle
    vehiculo = bd.query(models.Vehiculo).filter(
        models.Vehiculo.id == vehiculo_id,
        models.Vehiculo.es_activo == True
    ).first()
    if not vehiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="El vehículo solicitado no existe o ya no se encuentra disponible en el catálogo.")
    # Ensure vehicle is approved
    if vehiculo.estado_validacion != "aprobado":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Operación inválida: El vehículo no cuenta con la aprobación del inspector.")

    # Validate payment method from request body
    data = await request.json()
    metodo_pago = data.get("metodo_pago")
    if metodo_pago not in ["QR", "EFECTIVO", "BANCA_MOVIL", "DOLARES"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Método de pago no válido. Use QR, EFECTIVO, BANCA_MOVIL o DOLARES.")

    # Generate transaction code
    prefijo_map = {"QR": "QR", "EFECTIVO": "EF", "BANCA_MOVIL": "BM", "DOLARES": "USD"}
    prefijo = prefijo_map[metodo_pago]
    timestamp = int(datetime.datetime.utcnow().timestamp())
    codigo_transaccion = f"TX-{prefijo}-{timestamp}-{uuid.uuid4().hex[:8].upper()}"

    try:
        # Create purchase record
        nueva_compra = models.Compra(
            comprador_id=comprador.id,
            vehiculo_id=vehiculo.id,
            vendedor_id=vehiculo.vendedor_id,
            metodo_pago=metodo_pago,
            codigo_transaccion=codigo_transaccion,
            monto=vehiculo.precio_clp,
            fecha=datetime.datetime.utcnow()
        )
        bd.add(nueva_compra)

        # Update vehicle status to sold
        vehiculo.estado_validacion = "vendido"
        bd.commit()
        bd.refresh(nueva_compra)

        return {
            "exito": True,
            "mensaje": "¡Compra iniciada exitosamente! El vehículo ha cambiado a estado vendido.",
            "compra_id": nueva_compra.id,
            "codigo_transaccion": codigo_transaccion,
            "nuevo_estado_vehiculo": "vendido"
        }
    except Exception as e:
        bd.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error crítico en la base de datos de TechStore-Manager: {str(e)}")
        # Duplicate endpoint removed - original implementation retained above
        async def comprar_vehiculo(
            vehiculo_id: str,
            compra: models.Compra,  # placeholder for request body, will be replaced below
            comprador: models.Usuario = Depends(obtener_usuario_desde_token),
            bd: Session = Depends(obtener_bd)
        ):
            """
            Process a vehicle purchase.
            Expects a JSON body with the selected payment method.
            """
            # Validate role
            if comprador.rol != "comprador":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                    detail="Permisos insuficientes: Solo los usuarios con rol 'comprador' pueden adquirir vehículos.")

            # Find active vehicle
            vehiculo = bd.query(models.Vehiculo).filter(
                models.Vehiculo.id == vehiculo_id,
                models.Vehiculo.es_activo == True
            ).first()
            if not vehiculo:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                    detail="El vehículo solicitado no existe o ya no se encuentra disponible en el catálogo.")
            # Ensure vehicle is approved
            if vehiculo.estado_validacion != "aprobado":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail="Operación inválida: El vehículo no cuenta con la aprobación del inspector.")

            # Validate payment method from request body
            data = await request.json()
            metodo_pago = data.get("metodo_pago")
            if metodo_pago not in ["QR", "EFECTIVO", "BANCA_MOVIL", "DOLARES"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail="Método de pago no válido. Use QR, EFECTIVO, BANCA_MOVIL o DOLARES.")

            # Generate transaction code
            prefijo_map = {"QR": "QR", "EFECTIVO": "EF", "BANCA_MOVIL": "BM", "DOLARES": "USD"}
            prefijo = prefijo_map[metodo_pago]
            timestamp = int(datetime.datetime.utcnow().timestamp())
            codigo_transaccion = f"TX-{prefijo}-{timestamp}-{uuid.uuid4().hex[:8].upper()}"

            try:
                # Create purchase record
                nueva_compra = models.Compra(
                    comprador_id=comprador.id,
                    vehiculo_id=vehiculo.id,
                    vendedor_id=vehiculo.vendedor_id,
                    metodo_pago=metodo_pago,
                    codigo_transaccion=codigo_transaccion,
                    monto=vehiculo.precio_clp,
                    fecha=datetime.datetime.utcnow()
                )
                bd.add(nueva_compra)

                # Update vehicle status to sold
                vehiculo.estado_validacion = "vendido"
                bd.commit()
                bd.refresh(nueva_compra)

                return {
                    "exito": True,
                    "mensaje": "¡Compra iniciada exitosamente! El vehículo ha cambiado a estado vendido.",
                    "compra_id": nueva_compra.id,
                    "codigo_transaccion": codigo_transaccion,
                    "nuevo_estado_vehiculo": "vendido"
                }
            except Exception as e:
                pass
    # Log error and continue
    print(f"Error processing purchase: {e}")

# Endpoint for inspector approval queue
@app.get("/api/vehiculos/cola-aprobacion", status_code=status.HTTP_200_OK)
        def listar_cola_aprobacion(
            inspector: models.Usuario = Depends(obtener_usuario_desde_token),
            bd: Session = Depends(obtener_bd)
        ):
            """
            Returns list of vehicles pending approval for inspector.
            """
            if inspector.rol != "inspector":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                    detail="Acceso denegado: Solo el personal de inspección técnica puede acceder a esta cola.")
            try:
                vehiculos_pendientes = bd.query(models.Vehiculo).filter(
                    models.Vehiculo.estado_validacion == "pendiente",
                    models.Vehiculo.es_activo == True
                ).order_by(models.Vehiculo.creado_at.asc()).all()
                return {
                    "exito": True,
                    "total_pendientes": len(vehiculos_pendientes),
                    "vehiculos": vehiculos_pendientes
                }
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Error al recuperar la cola de aprobación: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Servidor MASTER API iniciado en http://localhost:8005")
    uvicorn.run(app, host="0.0.0.0", port=8005)
