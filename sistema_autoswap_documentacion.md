# Documentación Técnica del Sistema: AutoSwap Bolivia
*Marketplace de Autos Usados con Garantía Escrow, Verificación KYC e Inspección Mecánica*

---

## 1. Introducción y Visión General

**AutoSwap** es una plataforma web moderna de compraventa e intercambio de vehículos usados diseñada específicamente para mitigar los riesgos de fraude en el mercado boliviano. La plataforma integra tres pilares fundamentales de seguridad transaccional:
1. **Verificación de Identidad (KYC):** Autenticación obligatoria de vendedores y compradores antes de realizar transacciones financieras o agendar visitas de inspección.
2. **Inspección Técnica Certificada:** Un proceso riguroso de 150 puntos realizado por inspectores independientes para validar el estado real de cada vehículo.
3. **Pasarela con Custodia de Fondos (Escrow):** Retención del dinero de compraventa en una cuenta segura de AutoSwap, liberándolo al vendedor únicamente cuando la transferencia de propiedad ha sido registrada ante el Registro Civil o Notaría autorizada.

Este documento detalla el estado actual del desarrollo del sistema completo, abarcando la landing page pública, el panel de control de roles (dashboard), el servidor en FastAPI, la integración con la base de datos de producción **Supabase (PostgreSQL)** y la arquitectura de despliegue en la nube.

---

## 2. Arquitectura de Software

La arquitectura de AutoSwap adopta un enfoque híbrido, optimizando el rendimiento mediante la separación de la **Landing Page pública** (enfocada en SEO, velocidad y captación) y el **Dashboard interactivo** (una SPA estructurada para operaciones complejas).

```mermaid
graph TD
    User([Usuario / Navegador]) -->|Carga de Landing Page | RouteRoot[Next.js Landing - Puerto 3001 / Ruta: /]
    User -->|Iniciar Sesión / Registro / App | RouteApp[Vite React Dashboard - Puerto 3000 / Ruta: /app]
    
    subgraph Frontend [Capa de Presentación - Estática en Render CDN]
        RouteRoot
        RouteApp
    end

    RouteApp -->|Peticiones REST API / JSON| API[FastAPI Backend - Puerto 10000 / Render Web Service]
    
    subgraph Backend [Capa de Negocio - Python FastAPI]
        API -->|Controladores / Rutas| Routers[Routers: Usuarios, Vehículos, Compras, Auditoría]
        API -->|Generación de Reportes| Reports[PDF Report Generator - ReportLab]
    end
    
    subgraph Base_Datos [Capa de Datos - Cloud]
        Routers -->|SQLAlchemy ORM / Pooler| DB[(Supabase PostgreSQL Database)]
    end
```

### 2.1. Componentes del Proyecto:
* **Landing Page (Pública):** Construida con **Next.js 14**, **Tailwind CSS**, y **Framer Motion**. Se encarga de captar usuarios, mostrar autos destacados y dar a conocer el funcionamiento del sistema. Está optimizada para exportación estática (`output: 'export'`).
* **Dashboard (Privado):** Construido con **React 19**, **Vite 6**, y **Tailwind CSS**. Es una aplicación interactiva que maneja el ciclo de vida de los productos, inspecciones, compras, estados de usuario y configuración del sistema.
* **Backend (API de Servidor):** Construido con **Python FastAPI** y **Uvicorn**. Implementa los servicios REST, validaciones, generación de reportes PDF, lógica transaccional y conexión a la base de datos de producción.

---

## 3. Capa de Datos: Integración con Supabase (PostgreSQL)

La persistencia de AutoSwap utiliza **Supabase** como su motor de base de datos relacional de producción a través de conexiones seguras a PostgreSQL. El acceso a datos se gestiona mediante el ORM **SQLAlchemy** en Python, implementando un pool de conexiones optimizado para entornos serverless y la nube.

### 3.1. Configuración de Conexión (`backend/database.py`)
La conexión se establece a través del pooler transaccional de Supabase en el puerto `5432` mediante la variable de entorno `SUPABASE_DATABASE_URL`:
```python
SQLALCHEMY_DATABASE_URL = os.getenv(
    "SUPABASE_DATABASE_URL",
    "postgresql://postgres.[PROYECTO_ID]:[CONTRASENA]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### 3.2. Esquema Detallado de Tablas (`backend/models.py`)

A continuación se detalla la estructura física y lógica de las principales tablas almacenadas en Supabase:

#### 3.2.1. Tabla: `usuarios`
Almacena las cuentas registradas con sus roles y estados KYC.
* `id` (String, Primary Key): Identificador único de usuario.
* `nombre` (String): Nombre completo del usuario.
* `correo` (String, Unique, Indexed): Correo electrónico principal.
* `contrasena_encriptada` (String): Hash seguro de la contraseña.
* `rol` (String): Rol asignado (`admin`, `vendedor`, `comprador`, `inspector`).
* `estado` (String): Estado de la cuenta (`Activo`, `Inactivo`).
* `kyc_estado` (String): Estado de verificación de identidad (`Pendiente`, `Aprobado`, `Rechazado`).
* `iniciales` (String): Iniciales generadas automáticamente para la interfaz.
* `avatar` (String, Nullable): URL de la imagen de perfil cargada en el storage.
* `calificacion_promedio` (Float): Calificación transaccional del usuario (0.0 a 5.0).
* `ultimo_login` (DateTime, Nullable): Marca de tiempo del último acceso.

#### 3.2.2. Tabla: `vehiculos`
Almacena los autos en venta con sus detalles técnicos y estado transaccional.
* `id` (String, Primary Key): UUID autogenerado.
* `vendedor_id` (String, ForeignKey `usuarios.id`): Vendedor dueño de la publicación.
* `titulo` (String): Título comercial del anuncio.
* `descripcion` (String): Descripción cualitativa del estado del auto.
* `marca` (String): Marca oficial (ej: Toyota, Suzuki).
* `modelo` (String): Modelo comercial.
* `anio` (Integer): Año de fabricación.
* `kilometraje_km` (Integer): Odómetro en kilómetros.
* `precio_clp` (Float): Precio comercial de venta en bolivianos/moneda local.
* `categoria` (String): Tipo de carrocería (ej. SUV, Sedan, Hatchback).
* `tipo_combustible` (String): Gasolina, Diésel, Gas, Híbrido, Eléctrico.
* `transmision` (String): Automático o Manual.
* `patente` (String, Unique, Nullable): Placa vehicular para cruzamiento con reportes.
* `region` / `ciudad` (String): Datos de geolocalización de venta.
* `estado_validacion` (String): Aprobación técnica (`pendiente`, `aprobado`, `rechazado`).
* `estado_venta` (String): Estado de disponibilidad (`disponible`, `reservado`, `vendido`).
* `es_activo` (Boolean): Visibilidad lógica de la publicación.

#### 3.2.3. Tabla: `fotos_vehiculo`
Relaciona imágenes del storage de Supabase con los anuncios.
* `id` (String, Primary Key): UUID autogenerado.
* `vehiculo_id` (String, ForeignKey `vehiculos.id` con borrado en cascada).
* `ruta_almacenamiento` (String): URL de la imagen almacenada.
* `etiqueta_angulo` (String): Identificación del ángulo (ej. frontal, motor, interior).
* `es_primaria` (Boolean): Indica si es la foto de portada.
* `orden_visualizacion` (Integer): Control del slider de imágenes.

#### 3.2.4. Tabla: `compras` (Capa Transaccional / Escrow)
Gestiona las promesas de compra y la retención del dinero en custodia.
* `id` (String, Primary Key): UUID autogenerado.
* `comprador_id` (String, ForeignKey `usuarios.id`): Solicitante de la compra.
* `vehiculo_id` (String, ForeignKey `vehiculos.id`): Auto en compraventa.
* `vendedor_id` (String, ForeignKey `usuarios.id`): Vendedor que recibirá los fondos.
* `monto` (Float): Importe total de la oferta.
* `metodo_pago` (String): Medio de depósito (`QR`, `Efectivo`, `Banca Móvil`).
* `codigo_transaccion` (String, Unique): ID de referencia bancario o hash de pago.
* `estado` (String): Estado del Escrow (`pendiente_aceptacion`, `fondos_en_custodia`, `liberado`, `reembolsado`, `disputado`).

#### 3.2.5. Tabla: `auditoria` y `registro_auditoria_validacion`
Tablas dedicadas al registro de trazas inmutables de seguridad.
* `id` (String, Primary Key): UUID.
* `vehiculo_id` / `usuario_id` (String, Foreign Keys).
* `accion` (String): Modificación realizada (ej. `APROBAR_VEHICULO`, `RECHAZAR_VEHICULO`, `MODIFICAR_PRECIO`).
* `estado_anterior` / `estado_nuevo` (String): Captura de estados históricos.
* `motivo` (String): Explicación dada por el administrador/inspector.
* `creado_at` (DateTime): Marca de tiempo inalterable.

---

## 4. Módulos y Funcionalidades Completados

### 4.1. Landing Page Pública (Carpeta: `landing/`)
Diseño de alto impacto visual responsivo que actúa como fachada pública de la aplicación.
* **Buscador Integrado:** Formulario dinámico de marcas, modelos y presupuestos en el Hero.
* **Componente de Destacados:** Carga dinámica de las publicaciones mejor valoradas con sus badges de seguridad (`Garantía Escrow`, `Inspección Aprobada`).
* **Enlaces Inteligentes:** Menús de acceso que identifican el entorno local/producción y saltan directamente al panel de control de forma transparente para el usuario.

### 4.2. Panel de Control / Dashboard (Carpeta: `src/`)
Implementa las operaciones de negocio y cambia de interfaz según el rol del usuario autenticado:

| Rol de Usuario | Pantallas Disponibles | Permisos y Operaciones Críticas |
|---|---|---|
| **Administrador** | Dashboard, Gestión de Usuarios, Catálogo, Publicar Auto, Reportes, Configuración, Auditoría. | Modificación de roles, aprobación/bloqueo de cuentas, auditoría de logs, descarga de reportes PDF de ventas globales. |
| **Vendedor** | Dashboard Vendedor, Publicar Auto, Catálogo General, Detalle de Auto, Ventas Pendientes, Mi Perfil. | Creación de anuncios, carga del padrón de propiedad, aceptación de ofertas de compraventa, seguimiento de liberación de fondos. |
| **Comprador** | Catálogo, Detalle de Auto, Mis Compras, Historial de Pagos, Mi Perfil. | Búsqueda avanzada de autos, envío de oferta vinculante, pago en custodia digital (Escrow), firma electrónica de acta de recepción. |
| **Inspector** | Vehículos a Asignar, Registro de Inspección, Mi Perfil. | Visualización de hojas de ruta, carga de pautas de evaluación técnica, registro de códigos de error OBD2. |

---

## 5. Enrutamiento y Enlaces Profundos (Deep Links)

Para lograr que la Landing Page estática (Next.js) y el Dashboard (Vite React) cooperen en un mismo dominio de Render, desarrollamos dos soluciones de software:

### 5.1. Utilidad de Enlace Dinámico (`landing/src/utils/navigation.ts`)
Calcula en tiempo de ejecución a dónde enviar al usuario cuando da clic en "Iniciar Sesión" o "Publicar Auto":
* **En desarrollo:** Redirige a `http://localhost:3000/#login` (Servidor Vite).
* **En producción:** Redirige al subdirectorio `/app/#login` (Misma URL de Render).

### 5.2. Parser de Enlaces Profundos en el Dashboard (`src/App.tsx`)
Debido a que el Dashboard maneja su navegación mediante un estado de React (`useState`), añadimos un analizador de hash que procesa la URL entrante del navegador al cargar o al dispararse el evento `hashchange`:
```typescript
const parseHash = () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  const [route, queryString] = hash.split('?');
  const params = new URLSearchParams(queryString || '');
  return { route: route as Screen, params };
};
```
Esto permite enlaces como `https://autoswap.onrender.com/app/#product-detail?id=v1` para que carguen la pantalla del vehículo `v1` directamente.

---

## 6. Configuración de Despliegue Automatizado en Render

Configuramos un sistema de despliegue automatizado basado en infraestructura como código (`render.yaml`) y un script de compilación para unir ambos frameworks en un único servicio web.

### 6.1. Comando de Compilación Combinado (`build-all.sh`)
El archivo [build-all.sh](file:///c:/praticas-tareas/TechStore-Manager/TechStore-Manager-/build-all.sh) realiza las siguientes acciones secuenciales en el servidor de compilación de Render:
1. Compila la aplicación del **Dashboard de Vite** ejecutando `npm run build` y genera los assets listos en la carpeta `dist/`.
2. Se mueve al directorio `/landing` e instala dependencias y ejecuta la compilación de la **Landing Page de Next.js** en modo exportación estática, generando los archivos en `/landing/out`.
3. Crea el subdirectorio `/landing/out/app/` y copia recursivamente todos los archivos generados en `dist/` (el Dashboard) hacia esa carpeta.
4. Render expone el directorio `/landing/out/` al público. Como resultado:
   * Al acceder a `https://[dominio]/` se muestra la Landing de Next.js.
   * Al acceder a `https://[dominio]/app/` se despliega el Dashboard de Vite sin interferir entre sí y compartiendo el mismo dominio.

### 6.2. Instrucciones para Actualizar en Render Dashboard:
Para que esta arquitectura combinada funcione en Render, debes asegurarte de que el servicio del **Static Site** de tu frontend tenga los siguientes valores configurados en su pestaña de **Settings**:
* **Build Command:** `bash build-all.sh`
* **Publish Directory:** `landing/out`
* **Variable de Entorno:** `VITE_API_URL` apuntando a la URL del backend de FastAPI.
* **Variable de Entorno (en el backend):** `SUPABASE_DATABASE_URL` con el string de conexión de producción de Supabase.
