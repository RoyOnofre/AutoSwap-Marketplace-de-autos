import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Simple banner carousel (static for now)
export const FeaturedBanner: React.FC = () => {
  const ads = [
    {
      title: 'Suzuki Swift 2024',
      description: '¡El más ahorrador para las calles de Sucre! Desde 15,500 USD.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
    },
    {
      title: 'Toyota Land Cruiser 2025',
      description: 'Precio: 145,000 Bs. (Requiere Inspección Técnica Obligatoria)',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400',
      requiresInspection: true,
    },
    {
      title: 'Nissan Sentra 2022',
      description: 'Semi-nuevo, papeles al día. ¡Oferta de la semana!',
      image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {ads.map((ad, idx) => (
        <div key={idx} className="relative overflow-hidden bg-surface-dark/30 border border-primary/10 rounded-[32px] group min-h-[220px]">
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full min-h-[220px] object-cover opacity-60 group-hover:opacity-85 transition-opacity"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <h3 className="text-xl font-black text-white leading-tight tracking-tight">{ad.title}</h3>
            <p className="text-xs text-slate-300 mt-1 font-medium">{ad.description}</p>
            {ad.requiresInspection && (
              <span className="mt-3 inline-flex items-center gap-1 self-start px-3 py-1 bg-amber-400/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-400/10">
                <AlertTriangle size={12} /> Requiere Inspección
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
