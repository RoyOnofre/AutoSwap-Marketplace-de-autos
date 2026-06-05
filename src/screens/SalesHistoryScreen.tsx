import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical, Eye, Calendar, ShoppingBag, CreditCard, User, TrendingUp, Star, RefreshCw } from 'lucide-react';
import { MOCK_SALES } from '../constants';
import { UserRole } from '../types';
import { api } from "../api.1";
import { toast } from 'react-hot-toast';
import { RatingModal } from '../components/RatingModal';

interface SalesHistoryScreenProps {
  userRole: UserRole;
}

const SalesHistoryScreen: React.FC<SalesHistoryScreenProps> = ({ userRole }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rating states
  const [selectedVendedorId, setSelectedVendedorId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (userRole === 'comprador') {
        const res = await api.getCompras();
        setSales(res);
      } else if (userRole === 'vendedor') {
        const res = await api.getVentas();
        setSales(res);
      } else {
        // Fallback for admin or inspector
        const savedSales = JSON.parse(localStorage.getItem('sales_history') || '[]');
        const formattedSavedSales = savedSales.map((s: any) => ({
          id: s.id,
          fecha: s.date,
          vendedor: { nombre: 'Sistema' },
          comprador: { nombre: s.customer || 'Desconocido' },
          vehiculo: { marca: 'Producto', modelo: 'Tecnológico' },
          monto: s.total,
          metodo_pago: s.paymentMethod || 'Efectivo',
          codigo_transaccion: s.id,
        }));
        setSales([...formattedSavedSales, ...MOCK_SALES.map((m: any) => ({
          id: m.id,
          fecha: m.date,
          vendedor: { nombre: 'Sistema' },
          comprador: { nombre: m.customer },
          vehiculo: { marca: 'Mock', modelo: 'Device' },
          monto: m.total,
          metodo_pago: m.paymentMethod,
          codigo_transaccion: m.id,
        }))]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userRole]);

  // Filter sales by search query (transaction code, vehicle model/brand, name)
  const filteredSales = sales.filter(s => {
    const query = searchQuery.toLowerCase();
    const matchesCode = (s.codigo_transaccion || '').toLowerCase().includes(query);
    const matchesBrand = (s.vehiculo?.marca || '').toLowerCase().includes(query);
    const matchesModel = (s.vehiculo?.modelo || '').toLowerCase().includes(query);
    const matchesBuyer = (s.comprador?.nombre || '').toLowerCase().includes(query);
    const matchesSeller = (s.vendedor?.nombre || '').toLowerCase().includes(query);
    return matchesCode || matchesBrand || matchesModel || matchesBuyer || matchesSeller;
  });

  const getScreenTitle = () => {
    if (userRole === 'comprador') return 'Mis Compras';
    if (userRole === 'vendedor') return 'Mis Ventas Realizadas';
    return 'Historial de Transacciones';
  };

  const getScreenSub = () => {
    if (userRole === 'comprador') return 'Consulta el detalle y reputación de tus adquisiciones certificadas';
    if (userRole === 'vendedor') return 'Control y seguimiento de tus ventas con garantía Escrow';
    return 'Auditoría completa de transacciones y conciliaciones del sistema';
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">{getScreenTitle()}</h1>
          <p className="text-slate-400 text-xs font-semibold">{getScreenSub()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 bg-surface-dark border border-primary/10 rounded-xl text-slate-400 hover:text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          {userRole === 'admin' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-primary/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-primary/10 hover:text-primary transition-all">
              <Download size={18} />
              Exportar Reporte
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats - Only for vendedor and admin */}
      {(userRole === 'vendedor' || userRole === 'admin') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SaleStatCard 
            label={userRole === 'vendedor' ? "Ventas Totales" : "Órdenes Totales"} 
            value={filteredSales.length.toString()} 
            trend="+12%" 
            icon={<ShoppingBag size={20} />} 
          />
          <SaleStatCard 
            label="Monto Acumulado" 
            value={`Bs. ${filteredSales.reduce((acc, curr) => acc + (curr.monto || 0), 0).toLocaleString()}`} 
            trend="+15%" 
            icon={<CreditCard size={20} />} 
          />
          <SaleStatCard 
            label="Ticket Promedio" 
            value={`Bs. ${filteredSales.length > 0 ? Math.round(filteredSales.reduce((acc, curr) => acc + (curr.monto || 0), 0) / filteredSales.length).toLocaleString() : '0'}`} 
            trend="+3%" 
            icon={<TrendingUp size={20} />} 
          />
        </div>
      )}

      {/* Table Section */}
      <div className="bg-surface-dark/50 border border-primary/10 rounded-[32px] overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por código, auto, persona..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background-dark/50 border border-primary/10 rounded-xl py-2 pl-10 pr-4 w-64 focus:outline-none focus:border-primary/50 text-sm text-white"
              />
            </div>
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Mostrando {filteredSales.length} transacciones
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="animate-spin text-primary w-10 h-10" />
              <p className="text-slate-400 text-xs font-bold">Cargando transacciones...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <ShoppingBag size={48} className="mx-auto text-slate-600 opacity-30" />
              <p className="text-slate-400 text-sm font-bold">No se encontraron transacciones en el historial.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-dark/30">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehículo</th>
                  {userRole !== 'comprador' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comprador</th>}
                  {userRole !== 'vendedor' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendedor</th>}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pago</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  {userRole === 'comprador' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-primary font-bold">{sale.codigo_transaccion || sale.id}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {sale.fecha || 'Reciente'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white uppercase">{sale.vehiculo?.marca} {sale.vehiculo?.modelo}</p>
                      {sale.vehiculo?.anio && <span className="text-[10px] text-slate-500">{sale.vehiculo?.anio}</span>}
                    </td>
                    {userRole !== 'comprador' && (
                      <td className="px-6 py-4 text-xs font-bold text-slate-350">
                        {sale.comprador?.nombre || 'S/D'}
                      </td>
                    )}
                    {userRole !== 'vendedor' && (
                      <td className="px-6 py-4 text-xs font-bold text-slate-350">
                        {sale.vendedor?.nombre || 'S/D'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-white">Bs. {(sale.monto || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {sale.metodo_pago || 'QR'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Asegurado (Escrow)
                      </span>
                    </td>
                    {userRole === 'comprador' && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            if (sale.vendedor_id) {
                              setSelectedVendedorId(sale.vendedor_id);
                              setShowRatingModal(true);
                            } else {
                              toast.error("Vendedor no disponible para calificar");
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-background-dark border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <Star size={12} />
                          Calificar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedVendedorId && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedVendedorId(null);
          }}
          vendedorId={selectedVendedorId}
          onSuccess={() => {
            fetchHistory();
          }}
        />
      )}
    </div>
  );
};

const SaleStatCard = ({ label, value, trend, icon }: any) => (
  <div className="bg-surface-dark/50 border border-primary/10 p-6 rounded-[32px] backdrop-blur-sm animate-in zoom-in-95 duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-background-dark rounded-2xl text-primary">
        {icon}
      </div>
      <span className="text-xs font-bold text-emerald-400">{trend}</span>
    </div>
    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
    <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight">{value}</h3>
  </div>
);

export default SalesHistoryScreen;
