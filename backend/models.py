from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

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
