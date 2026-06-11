import React, { useEffect, useState } from 'react';
import { api } from "../api";
import { toast } from 'react-hot-toast';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  seller_name: string;
  // Additional fields as needed
}

interface InspectorScreenProps {
  userRole: string;
  onBack: () => void;
}

const InspectorScreen: React.FC<InspectorScreenProps> = ({ userRole, onBack }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await api.obtenerColaAprobacion();
      const mapped = (data.vehiculos || []).map((v: any) => ({
        id: v.id,
        title: v.titulo,
        description: v.descripcion,
        price: v.precio_clp,
        seller_name: v.vendedor_nombre || 'Vendedor'
      }));
      setListings(mapped);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar inspecciones pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'inspector' || userRole === 'admin') {
      fetchPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      const mappedStatus = status === 'approved' ? 'aprobado' : 'rechazado';
      let motivo = undefined;
      
      if (mappedStatus === 'rechazado') {
        const razon = prompt("Por favor, ingresa el motivo del rechazo del vehículo:");
        if (razon === null) return; // Inspector canceló la acción
        if (!razon.trim()) {
          toast.error("El motivo de rechazo es obligatorio.");
          return;
        }
        motivo = razon.trim();
      }

      await api.validarVehiculo(id, mappedStatus, motivo);
      toast.success(`Vehículo ${mappedStatus === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente`);
      // Refresh list
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e: any) {
      toast.error(e.message || 'Error actualizando el estado del vehículo');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Vehículos a inspeccionar</h2>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-dark transition">
          <X size={24} className="text-white" />
        </button>
      </div>
      {loading ? (
        <p className="text-slate-400">Cargando...</p>
      ) : listings.length === 0 ? (
        <p className="text-slate-400">No hay vehículos pendientes de inspección.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-surface-dark rounded-xl p-4 shadow-xl border border-primary/10">
              <h3 className="text-xl font-semibold text-white mb-2">{listing.title}</h3>
              <p className="text-slate-300 mb-2 line-clamp-3">{listing.description}</p>
              <p className="text-amber-400 font-bold mb-2">Bs. {listing.price?.toLocaleString()}</p>
              <p className="text-slate-500 text-sm mb-4">Vendedor: {listing.seller_name}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleStatus(listing.id, 'approved')}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                >
                  <CheckCircle size={16} /> Aprobar
                </button>
                <button
                  onClick={() => handleStatus(listing.id, 'rejected')}
                  className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded"
                >
                  <XCircle size={16} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectorScreen;
