import React, { useEffect, useState } from 'react';
import { api } from "../api";
import { toast } from 'react-hot-toast';
import { Eye } from 'lucide-react';

interface SellerCatalogScreenProps {
  onSelectProduct: (id: string) => void;
  currentUser: any;
}

const SellerCatalogScreen: React.FC<SellerCatalogScreenProps> = ({ onSelectProduct, currentUser }) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const data = await api.getMisPublicaciones();
      if (Array.isArray(data)) {
        // Double check / safety filter by vendedor_nombre to match the current user's name
        const filtered = data.filter((item: any) => 
          !item.vendedor_nombre || 
          item.vendedor_nombre.toLowerCase() === currentUser.name.toLowerCase()
        );
        setListings(filtered);
      } else {
        setListings([]);
      }
    } catch (e) {
      toast.error('Error al cargar tus publicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    const handler = () => fetchListings();
    window.addEventListener('inventoryUpdated', handler);
    return () => window.removeEventListener('inventoryUpdated', handler);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-white">Cargando tus publicaciones...</div>;
  }

  return (
    <div className="flex flex-col p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Mis Autos en Venta</h1>
        <p className="text-slate-400 text-sm">Gestiona tus publicaciones y revisa el estado de aprobación de tus vehículos.</p>
      </div>

      {listings.length === 0 ? (
        <div className="p-16 text-center bg-surface-dark/30 border border-primary/10 rounded-[32px] backdrop-blur-sm">
          <p className="text-slate-400 text-sm italic">No tienes vehículos publicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {listings.map((listing) => {
            const image = (listing.fotos && listing.fotos[0]?.ruta_almacenamiento) || 
                          listing.imagen || 
                          listing.image || 
                          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600';
            const name = listing.titulo || `${listing.marca} ${listing.modelo}` || 'Sin nombre';
            const price = listing.precio_clp || listing.precio || listing.price || 0;
            const validationStatus = listing.estado_validacion || 'pendiente';

            return (
              <div 
                key={listing.id} 
                className="bg-surface-dark/50 border border-primary/10 rounded-3xl overflow-hidden group hover:border-primary/40 transition-all backdrop-blur-sm flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={image} 
                    alt={name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                      validationStatus === 'aprobado' ? 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30' :
                      validationStatus === 'rechazado' ? 'bg-rose-400/20 text-rose-400 border-rose-400/30' :
                      'bg-amber-400/20 text-amber-400 border-amber-400/30'
                    }`}>
                      {validationStatus === 'aprobado' ? 'Aprobado' : 
                       validationStatus === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-primary font-medium uppercase tracking-widest">{listing.categoria || 'Auto'}</p>
                    <h3 className="text-lg font-bold text-white mt-1">{name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">Año: {listing.anio || 'S/D'} | Patente: {listing.patente || 'S/D'}</p>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Precio</p>
                        <p className="text-xl font-black text-white">Bs. {price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Km</p>
                        <p className="text-sm font-semibold text-slate-300">{(listing.kilometraje_km || 0).toLocaleString()} km</p>
                      </div>
                    </div>

                    {listing.motivo_rechazo && validationStatus === 'rechazado' && (
                      <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <p className="text-[10px] text-rose-400 font-bold uppercase">Motivo de rechazo:</p>
                        <p className="text-xs text-slate-300 mt-0.5">{listing.motivo_rechazo}</p>
                      </div>
                    )}

                    <button 
                      onClick={() => onSelectProduct(listing.id)}
                      className="w-full py-3 bg-background-dark border border-primary/20 rounded-2xl text-sm font-bold text-primary hover:bg-primary hover:text-background-dark transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerCatalogScreen;
