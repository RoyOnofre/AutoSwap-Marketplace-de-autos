const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8004/api";
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001/v1";

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
      const res = await fetch(`${GATEWAY_URL}/auth/login`, {
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
        throw new Error('No se pudo conectar con el gateway de autenticación. Verifica que esté iniciado en el puerto 3001.');
      }
      throw error;
    }
  },

  registrar: async (nombre: string, correo: string, contrasena: string, rol: string) => {
    const res = await fetch(`${GATEWAY_URL}/auth/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, contrasena, rol })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Error al registrar usuario (${res.status})`);
    }
    return res.json();
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
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
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
        throw new Error("No se pudo conectar con el servidor. Asegúrate de que el backend esté ejecutándose en el puerto 8004.");
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
  }
};
