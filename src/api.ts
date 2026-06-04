const API_URL = process.env.VITE_API_URL || `http://localhost:${process.env.VITE_BACKEND_PORT || 8005}/api`;
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.VITE_GATEWAY_URL || "http://localhost:3001/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || '';
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const api = {
  // ─────────────────────────────────────────
  // AUTENTICACIÓN VIA GATEWAY
  // ─────────────────────────────────────────
  login: async (correo: string, contrasena: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (res.status === 404) {
          throw new Error('El gateway de autenticación no está disponible en ' + GATEWAY_URL + '. Inicia el servicio del gateway.');
        }
        if (err && (err.detail || err.message)) {
          throw new Error(err.detail || err.message);
        }
        throw new Error(`Error de autenticación (${res.status}).`);
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor de autenticación. Verifica que el backend esté ejecutándose en el puerto 8005.');
      }
      throw error;
    }
  },

  registrar: async (nombre: string, correo: string, contrasena: string, rol: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, contrasena, rol })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || err?.message || `Error al registrar usuario (${res.status})`);
      }
      return res.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor de registro. Verifica que el backend esté ejecutándose en el puerto 8005.');
      }
      throw error;
    }
  },

  resetContrasena: async (correo: string, nueva_contrasena: string) => {
    const res = await fetch(`${API_URL}/auth/reset-contrasena`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, nueva_contrasena })
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },

  // ─────────────────────────────────────────
  // GESTIÓN DE USUARIOS (CRUD COMPLETO)
  // ─────────────────────────────────────────
  getUsuarios: async (filtros?: { buscar?: string; rol?: string; estado?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.buscar) params.append("buscar", filtros.buscar);
    if (filtros?.rol && filtros.rol !== "todos") params.append("rol", filtros.rol);
    if (filtros?.estado && filtros.estado !== "todos") params.append("estado", filtros.estado);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/usuarios${query}`);
    if (!res.ok) throw new Error("Error obteniendo usuarios");
    return res.json();
  },

  actualizarUsuario: async (id: string, datos: {
    nombre?: string;
    correo?: string;
    rol?: string;
    estado?: string;
    kyc_estado?: string;
    nueva_contrasena?: string;
  }) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(datos)
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      return res.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor al actualizar usuario. Verifica que el backend esté ejecutándose en el puerto 8005.');
      }
      throw error;
    }
  },

  cambiarEstadoUsuario: async (id: string) => {
    const res = await fetch(`${API_URL}/usuarios/${id}/estado`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },

  eliminarUsuario: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Error al eliminar el usuario");
        } else {
          const textError = await res.text();
          throw new Error(`Error del servidor (${res.status}): ${textError.substring(0, 100)}`);
        }
      }
      
      return res.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("No se pudo conectar con el servidor. Asegúrate de que el backend esté ejecutándose en el puerto 8005.");
      }
      throw error;
    }
  },

  // ─────────────────────────────────────────
  // PRODUCTOS
  // ─────────────────────────────────────────
  getProductos: async () => {
    const res = await fetch(`${GATEWAY_URL}/listings`);
    if (!res.ok) throw new Error("Error obteniendo productos");
    return res.json();
  },

  crearProducto: async (producto: any) => {
    const res = await fetch(`${GATEWAY_URL}/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto)
    });
    if (!res.ok) throw new Error("Error creando producto");
    return res.json();
  },

  // ─────────────────────────────────────────
  // VENTAS / COMPRAS
  // ─────────────────────────────────────────
  crearVenta: async (venta: any) => {
    const res = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venta)
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },

  registrarVenta: async (venta: any) => {
    return api.crearVenta(venta);
  },

  descargarReporte: () => {
    window.open(`${API_URL}/reportes/ventas/pdf`, "_blank");
  },

  descargarReporteUsuarios: () => {
    window.open(`${API_URL}/reportes/usuarios/pdf`, "_blank");
  },

  // ─────────────────────────────────────────
  // AUTO-SWAP GATEWAY (NestJS MODULES)
  // ─────────────────────────────────────────
  submitKyc: async (userId: string, ciFrontBase64: string, ciBackBase64: string, selfieBase64: string) => {
    const res = await fetch(`${GATEWAY_URL}/kyc/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, ciFrontBase64, ciBackBase64, selfieBase64 })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al enviar KYC" }));
      throw new Error(err.message || "Error al enviar KYC");
    }
    return res.json();
  },

  crearTransaccion: async (listingId: string, amount: number, notes?: string) => {
    const res = await fetch(`${GATEWAY_URL}/transactions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ listingId, amount, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al crear transacción" }));
      throw new Error(err.message || "Error al crear transacción");
    }
    return res.json();
  },

  pagarTransaccion: async (id: string, paymentMethod: string) => {
    const res = await fetch(`${GATEWAY_URL}/transactions/${id}/pay`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentMethod })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al iniciar pago" }));
      throw new Error(err.message || "Error al iniciar pago");
    }
    return res.json();
  },

  getTransaccion: async (id: string) => {
    const res = await fetch(`${GATEWAY_URL}/transactions/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al obtener transacción" }));
      throw new Error(err.message || "Error al obtener transacción");
    }
    return res.json();
  },

  simularWebhookPago: async (transactionId: string, amount: number, buyerId: string, sellerId: string) => {
    const res = await fetch(`${GATEWAY_URL}/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: transactionId, status: 'paid', amount, buyer_id: buyerId, seller_id: sellerId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al simular webhook" }));
      throw new Error(err.message || "Error al simular webhook");
    }
    return res.json();
  },

  getEscrow: async (id: string) => {
    const res = await fetch(`${GATEWAY_URL}/escrow/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al obtener escrow" }));
      throw new Error(err.message || "Error al obtener escrow");
    }
    return res.json();
  },

  liberarEscrow: async (id: string) => {
    const res = await fetch(`${GATEWAY_URL}/escrow/${id}/release`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al liberar fondos" }));
      throw new Error(err.message || "Error al liberar fondos");
    }
    return res.json();
  },

  reembolsarEscrow: async (id: string) => {
    const res = await fetch(`${GATEWAY_URL}/escrow/${id}/refund`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al reembolsar" }));
      throw new Error(err.message || "Error al reembolsar");
    }
    return res.json();
  },

  getVehiculos: async (filtros?: { buscar?: string; marca?: string; modelo?: string; categoria?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.buscar) params.append("buscar", filtros.buscar);
    if (filtros?.marca) params.append("marca", filtros.marca);
    if (filtros?.modelo) params.append("modelo", filtros.modelo);
    if (filtros?.categoria) params.append("categoria", filtros.categoria);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/vehiculos${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Error obteniendo vehículos");
    return res.json();
  },

  registrarVehiculo: async (vehiculo: any) => {
    const res = await fetch(`${API_URL}/vehiculos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(vehiculo)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error registrando vehículo");
    }
    return res.json();
  },

  actualizarVehiculo: async (id: string, vehiculo: any) => {
    const res = await fetch(`${API_URL}/vehiculos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(vehiculo)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error actualizando vehículo");
    }
    return res.json();
  },

  eliminarVehiculo: async (id: string) => {
    const res = await fetch(`${API_URL}/vehiculos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error eliminando vehículo");
    }
    return res.json();
  },

  aprobarVehiculo: async (id: string) => {
    console.log('Aprobando Vehiculo ID:', id);
    const res = await fetch(`${API_URL}/vehiculos/${id}/aprobar`, {
      method: "PUT",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error aprobando vehículo");
    }
    return res.json();
  },

  submitRating: async (listingId: string, rating: number, comment: string) => {
    const res = await fetch(`${GATEWAY_URL}/ratings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ listing_id: listingId, rating, comment })
    });
    if (!res.ok) throw new Error('Error enviando la calificación');
    return res.json();
  },

  getPendingInspections: async () => {
    const res = await fetch(`${GATEWAY_URL}/listings/needs-inspection`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error fetching pending inspections');
    return res.json();
  },

  updateListingStatus: async (listingId: string, status: string) => {
    const res = await fetch(`${GATEWAY_URL}/listings/${listingId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Error updating listing status');
    return res.json();
  },

  obtenerPerfil: async (id: string) => {
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Error fetching perfil:', txt);
      throw new Error('Error al obtener el perfil del usuario');
    }
    const data = await res.json();
    return {
      id: data.id,
      name: data.nombre ?? data.name ?? '',
      email: data.correo ?? data.email ?? '',
      phone: data.telefono ?? data.phone ?? '',
      address: data.direccion ?? data.address ?? '',
      avatar: data.avatar,
      bio: data.bio || '',
      language: data.language || 'Español (Bolivia)',
      timezone: data.timezone || '(GMT-04:00) La Paz',
      twoFactor: data.two_factor ?? false,
      role: data.rol ?? data.role ?? '',
      kyc_estado: data.kyc_estado ?? data.kyc ?? 'Pendiente',
      calificacion_promedio: data.calificacion_promedio ?? 0.0,
    };
  },

  getMyListings: async () => {
    const res = await fetch(`${GATEWAY_URL}/listings/my`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      return api.getProductos();
    }
    return res.json();
  },

  verificarInspeccion: async (vehicleId: string, price: number) => {
    const res = await fetch(`${GATEWAY_URL}/inspections/verify/${vehicleId}/${price}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al verificar inspección" }));
      throw new Error(err.message || "Error al verificar inspección");
    }
    return res.json();
  },

  registrarInspeccion: async (vehicleId: string, status: 'approved' | 'rejected' | 'pending', details?: any, notes?: string) => {
    const res = await fetch(`${GATEWAY_URL}/inspections`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ vehicle_id: vehicleId, status, details, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al registrar inspección" }));
      throw new Error(err.message || "Error al registrar inspección");
    }
    return res.json();
  },
  // 🛒 NUEVO: FLUJO TRANSACCIONAL DE COMPRA
  comprarVehiculo: async (vehiculoId: string, metodoPago: string = "QR") => {
    const res = await fetch(`${API_URL}/transacciones/comprar/${vehiculoId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ metodo_pago: metodoPago })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error al comprar vehículo");
    }
    return res.json();
  },

  // 🕵️‍♂️ NUEVO: COLA DE VALIDACIÓN PARA EL INSPECTOR
  obtenerColaAprobacion: async () => {
    const res = await fetch(`${API_URL}/vehiculos/cola-aprobacion`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error obteniendo cola de aprobación");
    }
    return res.json();
  },

  getCompras: async () => {
    const res = await fetch(`${API_URL}/transacciones/compras`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error obteniendo compras");
    }
    return res.json();
  },

  getVentas: async () => {
    const res = await fetch(`${API_URL}/transacciones/ventas`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error obteniendo ventas");
    }
    return res.json();
  },

  calificarVendedor: async (vendedorId: string, puntaje: number, comentario?: string) => {
    const res = await fetch(`${API_URL}/calificaciones`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        vendedor_id: vendedorId,
        puntaje: puntaje,
        comentario: comentario
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Error al calificar al vendedor");
    }
    return res.json();
  },

};
