import React, { useEffect, useState } from 'react';
import { api } from "../api";
import { Compra } from '../types';

const VentasPendientesScreen: React.FC<{ userRole: string; currentUser: any; onBack: () => void }> = ({ onBack, currentUser }) => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const all = await api.getVentas();
        const filtered = all.filter((c: Compra) => 
          c.estado === 'pendiente_aceptacion' &&
          (!c.vendedor?.nombre || c.vendedor.nombre.toLowerCase() === currentUser.name.toLowerCase())
        );
        setCompras(filtered);
      } catch (e: any) {
        setError(e.message || 'Error al cargar ventas pendientes');
      } finally {
        setLoading(false);
      }
    };
    fetchCompras();
  }, [currentUser]);

  const openModal = (compra: Compra, type: 'accept' | 'reject') => {
    setSelectedCompra(compra);
    setActionType(type);
    setModalError(null);
    setModalOpen(true);
  };

  const handleAccept = (compraId: string) => {
    const compra = compras.find(c => c.id === compraId);
    if (compra) openModal(compra, 'accept');
  };

  const handleReject = (compraId: string) => {
    const compra = compras.find(c => c.id === compraId);
    if (compra) openModal(compra, 'reject');
  };

  const confirmAction = async () => {
    if (!selectedCompra || !actionType) return;
    try {
      if (actionType === 'accept') {
        await api.aceptarCompra(selectedCompra.id);
      } else {
        await api.rechazarCompra(selectedCompra.id);
      }
      setCompras(prev => prev.filter(c => c.id !== selectedCompra.id));
      setModalOpen(false);
    } catch (e: any) {
      setModalError(e.message || 'Error al procesar la compra');
    }
  };

  if (loading) return <div className="p-6 animate-pulse text-gray-500">Cargando ventas pendientes…</div>;
  if (error) return <div className="p-6 text-red-500 font-medium">{error}</div>;

  return (
    <div className="p-6 space-y-4 text-slate-200">
      <button onClick={onBack} className="text-slate-400 hover:underline mb-4">
        ← Volver al Dashboard
      </button>
      <h2 className="text-2xl font-bold text-slate-100">Ventas Pendientes</h2>
      {compras.length === 0 ? (
        <p className="text-gray-400 italic">No hay compras pendientes de aceptación.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-900 border border-slate-800 rounded-lg shadow-md">
            <thead>
              <tr>
                <th className="p-3 text-left text-slate-200 font-medium">Código</th>
                <th className="p-3 text-left text-slate-200 font-medium">Vehículo</th>
                <th className="p-3 text-left text-slate-200 font-medium">Comprador</th>
                <th className="p-3 text-left text-slate-200 font-medium">Monto</th>
                <th className="p-3 text-left text-slate-200 font-medium">Método</th>
                <th className="p-3 text-left text-slate-200 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(c => (
                <tr key={c.id} className="border-b border-slate-800">
                  <td className="p-3 text-slate-300">{c.codigo_transaccion.slice(0, 8)}...</td>
                  <td className="p-3 text-slate-300 font-medium">
                    {c.vehiculo ? `${c.vehiculo.marca} ${c.vehiculo.modelo} (${c.vehiculo.anio})` : 'Vehículo Desconocido'}
                  </td>
                  <td className="p-3 text-slate-300">{c.comprador?.nombre || c.comprador_id}</td>
                  <td className="p-3 font-semibold text-emerald-400">{c.monto.toLocaleString('es-CL')} Bs.</td>
                  <td className="p-3 capitalize text-slate-300">{c.metodo_pago}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleAccept(c.id)}
                      className="rounded-md px-4 py-2 text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleReject(c.id)}
                      className="rounded-md px-4 py-2 text-sm font-medium transition-colors bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedCompra && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-96 text-center text-slate-200">
            <div className="mb-4 text-xl font-semibold">
              {actionType === 'accept' ? 'Confirmar aceptación' : 'Confirmar rechazo'}
            </div>
            <p className="mb-4">
              {actionType === 'accept'
                ? `¿Seguro que deseas aceptar la compra ${selectedCompra.vehiculo?.titulo.slice(0, 8)}...?`
                : `¿Seguro que deseas rechazar la compra ${selectedCompra.vehiculo?.titulo.slice(0, 8)}...?`}
            </p>
            {modalError && <p className="text-red-400 mb-2">{modalError}</p>}
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded ${actionType === 'accept' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'} text-white`}
              >
                {actionType === 'accept' ? 'Aceptar' : 'Rechazar'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500 text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasPendientesScreen;
