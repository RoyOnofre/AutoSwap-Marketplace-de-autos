from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

# --- TABLAS DE APOYO (Deben definirse primero) ---

class Proveedor(Base):
    __tablename__ = "proveedores"
    
    id = Column(String, primary_key=True, index=True)
    nombre = Column(String, index=True)
    contacto = Column(String)
    correo = Column(String)
    telefono = Column(String)
    
    productos = relationship("Producto", back_populates="proveedor")

class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(String, primary_key=True, index=True)
    nombre = Column(String, index=True)
    correo = Column(String, unique=True, index=True)
    telefono = Column(String)
    nit_rfc = Column(String) # Para facturación
    direccion = Column(String)
    fecha_registro = Column(DateTime, default=datetime.datetime.utcnow)
    
    ventas = relationship("Venta", back_populates="cliente_obj")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, index=True)
    nombre = Column(String)
    correo = Column(String, unique=True, index=True)
    contrasena_encriptada = Column(String)
    rol = Column(String)  # admin, vendedor, comprador, inspector
    estado = Column(String, default="Activo")
    kyc_estado = Column(String, default="Pendiente")
    iniciales = Column(String)
    avatar = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    language = Column(String, default='Español (Bolivia)')
    timezone = Column(String, default='(GMT-04:00) La Paz')
    calificacion_promedio = Column(Float, default=0.0)
    ultimo_login = Column(DateTime, nullable=True)
    # Nuevas relaciones
    anuncios = relationship("Anuncio", back_populates="vendedor", cascade="all, delete-orphan")
    ofertas = relationship("Oferta", back_populates="comprador", cascade="all, delete-orphan")
    inspecciones = relationship("Inspeccion", back_populates="inspector", cascade="all, delete-orphan")
    calificaciones = relationship("Calificacion", back_populates="autor", cascade="all, delete-orphan")
    ventas = relationship("Venta", back_populates="cajero")
    movimientos = relationship("MovimientoInventario", back_populates="usuario")

# --- TABLA DE PRODUCTOS ---

class Producto(Base):
    __tablename__ = "productos"

    id = Column(String, primary_key=True, index=True)
    nombre = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    categoria = Column(String)
    precio = Column(Float)
    stock = Column(Integer)
    imagen = Column(String)
    estado = Column(String)
    meses_garantia_base = Column(Integer, default=12) # Garantía por defecto
    
    # Conexión con Proveedor
    proveedor_id = Column(String, ForeignKey("proveedores.id"), nullable=True)
    proveedor = relationship("Proveedor", back_populates="productos")
    
    movimientos = relationship("MovimientoInventario", back_populates="producto")
    detalles_venta = relationship("DetalleVenta", back_populates="producto")

# --- AUDITORÍA DE INVENTARIO ---

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    
    id = Column(String, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    tipo = Column(String) # ENTRADA, SALIDA, AJUSTE, DEVOLUCION
    cantidad = Column(Integer)
    motivo = Column(String)
    
    producto_id = Column(String, ForeignKey("productos.id"))
    producto = relationship("Producto", back_populates="movimientos")
    
    usuario_id = Column(String, ForeignKey("usuarios.id"))
    usuario = relationship("Usuario", back_populates="movimientos")

# --- VENTAS Y FACTURACIÓN ---

class Venta(Base):
    __tablename__ = "ventas"

    id = Column(String, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    subtotal = Column(Float)
    impuesto = Column(Float)
    total = Column(Float)
    cantidad_articulos = Column(Integer)
    metodo_pago = Column(String)
    estado = Column(String, default="Completada")
    
    # Conexiones
    usuario_id = Column(String, ForeignKey("usuarios.id")) # Quién lo vendió
    cajero = relationship("Usuario", back_populates="ventas")
    
    cliente_id = Column(String, ForeignKey("clientes.id"), nullable=True) # A quién se le vendió
    cliente_obj = relationship("Cliente", back_populates="ventas")

    detalles = relationship("DetalleVenta", back_populates="venta")


class Anuncio(Base):
    __tablename__ = "anuncios"

    id = Column(String, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    vin = Column(String, nullable=False)
    precio = Column(Float, nullable=False)
    fotos = Column(String)  # JSON list of URLs
    fecha_publicacion = Column(DateTime, default=datetime.datetime.utcnow)
    estado = Column(String, default="Borrador")  # Borrador, Activo, EnInspeccion, Rechazado
    vendedor_id = Column(String, ForeignKey("usuarios.id"))
    vendedor = relationship("Usuario", back_populates="anuncios")
    ofertas = relationship("Oferta", back_populates="anuncio", cascade="all, delete-orphan")
    inspeccion = relationship("Inspeccion", back_populates="anuncio", uselist=False, cascade="all, delete-orphan")

class Oferta(Base):
    __tablename__ = "ofertas"

    id = Column(String, primary_key=True, index=True)
    monto = Column(Float, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)
    estado = Column(String, default="Pendiente")  # Pendiente, Aceptada, Rechazada, Expirada
    comprador_id = Column(String, ForeignKey("usuarios.id"))
    comprador = relationship("Usuario", back_populates="ofertas")
    anuncio_id = Column(String, ForeignKey("anuncios.id"))
    anuncio = relationship("Anuncio", back_populates="ofertas")

class Inspeccion(Base):
    __tablename__ = "inspecciones"

    id = Column(String, primary_key=True, index=True)
    fecha_solicitud = Column(DateTime, default=datetime.datetime.utcnow)
    fecha_realizacion = Column(DateTime, nullable=True)
    informe_url = Column(String, nullable=True)
    estado = Column(String, default="Pendiente")  # Pendiente, Realizada, Rechazada
    inspector_id = Column(String, ForeignKey("usuarios.id"))
    inspector = relationship("Usuario", back_populates="inspecciones")
    anuncio_id = Column(String, ForeignKey("anuncios.id"), unique=True)
    anuncio = relationship("Anuncio", back_populates="inspeccion")

class Calificacion(Base):
    __tablename__ = "calificaciones"

    id = Column(String, primary_key=True, index=True)
    puntaje = Column(Integer, nullable=False)  # 1‑5
    comentario = Column(String, nullable=True)
    autor_id = Column(String, ForeignKey("usuarios.id"))
    autor = relationship("Usuario", back_populates="calificaciones")
    objetivo_id = Column(String, nullable=False)  # id del anuncio, oferta o inspección evaluada
    tipo_objetivo = Column(String, nullable=False)  # "Anuncio", "Oferta", "Inspeccion"

class DetalleVenta(Base):
    __tablename__ = "detalles_venta"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    venta_id = Column(String, ForeignKey("ventas.id"))
    producto_id = Column(String, ForeignKey("productos.id"))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)
    subtotal = Column(Float)
    
    # Control estricto de tecnología
    numero_serie = Column(String, nullable=True) # Serial de la laptop/celular
    meses_garantia_aplicada = Column(Integer, default=12)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles_venta")

class Auditoria(Base):
    __tablename__ = "auditoria"

    id = Column(String, primary_key=True, index=True)
    usuario_id = Column(String, ForeignKey("usuarios.id"))
    accion = Column(String)  # CREAR, EDITAR, ELIMINAR, LOGIN, RESET_PASS
    descripcion = Column(String)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relación para saber qué usuario hizo la acción
    usuario = relationship("Usuario")

class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendedor_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(String, nullable=False)
    marca = Column(String(80), nullable=False)
    modelo = Column(String(80), nullable=False)
    anio = Column(Integer, nullable=False)
    kilometraje_km = Column(Integer, nullable=False)
    precio_clp = Column(Float, nullable=False)
    categoria = Column(String, nullable=False)
    tipo_combustible = Column(String, nullable=False)
    transmision = Column(String, nullable=False)
    color_exterior = Column(String(50), nullable=True)
    patente = Column(String(8), unique=True, nullable=True)
    region = Column(String(80), nullable=False)
    ciudad = Column(String(80), nullable=False)
    estado_validacion = Column(String, nullable=False, default="pendiente")
    motivo_rechazo = Column(String, nullable=True)
    revisado_por = Column(String, ForeignKey("usuarios.id"), nullable=True)
    revisado_at = Column(DateTime, nullable=True)
    es_activo = Column(Boolean, nullable=False, default=True)
    estado_venta = Column(String, default='disponible')
    creado_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    actualizado_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    eliminado_at = Column(DateTime, nullable=True)

    vendedor = relationship("Usuario", foreign_keys=[vendedor_id])
    revisor = relationship("Usuario", foreign_keys=[revisado_por])
    fotos = relationship("FotoVehiculo", back_populates="vehiculo", cascade="all, delete-orphan")
    caracteristicas = relationship("CaracteristicaVehiculo", back_populates="vehiculo", cascade="all, delete-orphan")

class FotoVehiculo(Base):
    __tablename__ = "fotos_vehiculo"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehiculo_id = Column(String, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False)
    ruta_almacenamiento = Column(String, nullable=False)
    etiqueta_angulo = Column(String(50), nullable=False)
    es_primaria = Column(Boolean, nullable=False, default=False)
    orden_visualizacion = Column(Integer, nullable=False, default=0)
    creado_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    vehiculo = relationship("Vehiculo", back_populates="fotos")

class CaracteristicaVehiculo(Base):
    __tablename__ = "caracteristicas_vehiculo"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehiculo_id = Column(String, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False)
    clave_caracteristica = Column(String(80), nullable=False)
    etiqueta_caracteristica = Column(String(120), nullable=False)
    categoria = Column(String(60), nullable=False)

    vehiculo = relationship("Vehiculo", back_populates="caracteristicas")

class Compra(Base):
    __tablename__ = "compras"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    comprador_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    vehiculo_id = Column(String, ForeignKey("vehiculos.id"), nullable=False)
    vendedor_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    metodo_pago = Column(String, nullable=False)  # QR, EFECTIVO, BANCA_MOVIL, DOLARES
    codigo_transaccion = Column(String, unique=True, nullable=False)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    monto = Column(Float, nullable=False)
    estado = Column(String, default='pendiente_aceptacion')
    motivo_rechazo = Column(String, nullable=True)  # Optional rejection reason
    # Relationships
    comprador = relationship("Usuario", foreign_keys=[comprador_id])
    vehiculo = relationship("Vehiculo", foreign_keys=[vehiculo_id])
    vendedor = relationship("Usuario", foreign_keys=[vendedor_id])

class RegistroAuditoriaValidacion(Base):
    __tablename__ = "registro_auditoria_validacion"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehiculo_id = Column(String, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    accion = Column(String(30), nullable=False)
    estado_anterior = Column(String, nullable=False)
    estado_nuevo = Column(String, nullable=False)
    motivo = Column(String, nullable=True)
    creado_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    vehiculo = relationship("Vehiculo")
    admin = relationship("Usuario")
