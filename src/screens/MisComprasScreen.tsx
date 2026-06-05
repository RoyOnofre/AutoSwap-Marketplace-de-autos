import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Compra } from '../types';

const MisComprasScreen: React.FC<{ userRole: string; onBack: () => void }> = ({ onBack }) => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const data = await api.getCompras();
        setCompras(data);
      } catch (e: any) {
        setError(e.message || 'Error al cargar compras');
      } finally {
        setLoading(false);
      }
    };
    fetchCompras();
  }, []);

  if (loading) return <div className="p-6">Cargando compras…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <button onClick={onBack} className="text-blue-500 hover:underline mb-4">
        ← Volver
      </button>
      <h2 className="text-2xl font-bold">Mis Compras</h2>
      {compras.length === 0 ? (
        <p>No tienes compras.</p>
      ) : (
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Monto</th>
              <th className="p-2 text-left">Método</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.codigo_transaccion}</td>
                <td className="p-2">{c.monto.toLocaleString('es-CL')} CLP</td>
                <td className="p-2">{c.metodo_pago}</td>
                <td className="p-2">{new Date(c.fecha).toLocaleString()}</td>
                <td className="p-2 capitalize">{c.estado.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MisComprasScreen;

