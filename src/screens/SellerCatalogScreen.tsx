import React, { useEffect, useState } from 'react';
import { api } from "../api.1";
import { FeaturedBanner } from '../components/FeaturedBanner';
import { toast } from 'react-hot-toast';

const SellerCatalogScreen: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const data = await api.getMyListings();
      setListings(Array.isArray(data) ? data : []);
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
      <FeaturedBanner />
      <h1 className="text-4xl font-black text-white uppercase">Mis Publicaciones</h1>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {listings.map(listing => (
          <div key={listing.id} className="bg-surface-dark rounded-[24px] p-6 shadow-lg hover:shadow-primary/20 transition">
            <img src={listing.imagen || listing.image} alt={listing.nombre || listing.name} className="w-full h-48 object-cover rounded" />
            <h3 className="mt-4 text-lg font-black text-white uppercase">{listing.nombre || listing.name}</h3>
            <p className="text-sm text-slate-400">Precio: {listing.precio || listing.price} Bs.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerCatalogScreen;
