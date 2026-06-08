import React, { useEffect, useState } from 'react';
import { api } from "../api";
import { Compra } from '../types';

const VentasPendientesScreen: React.FC<{ userRole: string; onBack: () => void }> = ({ onBack }) => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const all = await api.getCompras();
        // Filter purchases where the vehicle belongs to current seller and status is pending acceptance
        const sellerId = localStorage.getItem('userId');
        const filtered = all.filter((c: Compra) => c.estado === 'pendiente_aceptacion' && c.vendedor_id === sellerId);
        setCompras(filtered);
      } catch (e: any) {
        setError(e.message || 'Error al cargar ventas pendientes');
      } finally {
        setLoading(false);
      }
    };
    fetchCompras();
  }, []);

  const handleAccept = async (compraId: string) => {
    try {
      await api.aceptarCompra(compraId);
      setCompras(prev => prev.filter(c => c.id !== compraId));
    } catch (e: any) {
      alert(e.message || 'Error al aceptar la compra');
    }
  };

  const handleReject = async (compraId: string) => {
    try {
      await api.rechazarCompra(compraId);
      setCompras(prev => prev.filter(c => c.id !== compraId));
    } catch (e: any) {
      alert(e.message || 'Error al rechazar la compra');
    }
  };

  if (loading) return <div className="p-6">Cargando ventas pendientes…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Ventas Pendientes</h2>
      {compras.length === 0 ? (
        <p>No hay compras pendientes de aceptación.</p>
      ) : (
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Comprador</th>
              <th className="p-2 text-left">Monto</th>
              <th className="p-2 text-left">Método</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map(c => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.codigo_transaccion}</td>
                <td className="p-2">{c.comprador_id}</td>
                <td className="p-2">{c.monto.toLocaleString('es-CL')} CLP</td>
                <td className="p-2">{c.metodo_pago}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => handleAccept(c.id)} className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">Aceptar</button>
                  <button onClick={() => handleReject(c.id)} className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700">Rechazar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VentasPendientesScreen;
