'use client';

import React from 'react';
import { Star, ShieldCheck, MapPin, Calendar, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import { VehicleListing } from '../types';
import { getDashboardUrl } from '../utils/navigation';

export default function FeaturedListings() {
  const listings: VehicleListing[] = [
    {
      id: "v1",
      marca: "Toyota",
      modelo: "Land Cruiser Prado",
      anio: 2021,
      kilometraje_km: 42000,
      precio_bs: 385000,
      imagen: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
      estado_validacion: "aprobado",
      tipo_combustible: "Gasolina",
      transmision: "Automático",
      ciudad: "Santa Cruz",
      garantia_escrow: true
    },
    {
      id: "v2",
      marca: "Suzuki",
      modelo: "Jimny GLX",
      anio: 2022,
      kilometraje_km: 15000,
      precio_bs: 135000,
      imagen: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
      estado_validacion: "aprobado",
      tipo_combustible: "Gasolina",
      transmision: "Manual",
      ciudad: "La Paz",
      garantia_escrow: true
    },
    {
      id: "v3",
      marca: "Nissan",
      modelo: "Patrol GR",
      anio: 2020,
      kilometraje_km: 60000,
      precio_bs: 290000,
      imagen: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
      estado_validacion: "aprobado",
      tipo_combustible: "Diésel",
      transmision: "Automático",
      ciudad: "Cochabamba",
      garantia_escrow: true
    },
    {
      id: "v4",
      marca: "Mitsubishi",
      modelo: "L200 Triton",
      anio: 2023,
      kilometraje_km: 12000,
      precio_bs: 215000,
      imagen: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
      estado_validacion: "aprobado",
      tipo_combustible: "Diésel",
      transmision: "Manual",
      ciudad: "Santa Cruz",
      garantia_escrow: true
    }
  ];

  return (
    <section id="inventario" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-4 text-left">
            <span className="text-xs font-black tracking-widest text-orange-500 uppercase">
              Catálogo Seleccionado
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Anuncios Destacados de la Semana
            </h2>
            <p className="text-slate-500 text-xs font-semibold">
              Explora vehículos certificados listos para transferencia y custodiados bajo Escrow.
            </p>
          </div>
          <a 
            href={`${getDashboardUrl()}/#inventory`} 
            className="text-xs font-black text-slate-900 uppercase tracking-wider hover:text-orange-500 transition-colors shrink-0 flex items-center gap-1.5"
          >
            Ver Todo el Inventario ➔
          </a>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {listings.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-slate-50 border border-slate-100 rounded-[32px] overflow-hidden group hover:shadow-xl hover:border-slate-200 transition-all flex flex-col"
            >
              {/* Photo Box */}
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-900">
                <img 
                  src={item.imagen} 
                  alt={`${item.marca} ${item.modelo}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  {item.estado_validacion === 'aprobado' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md">
                      <ShieldCheck size={12} /> Inspección Aprobada
                    </span>
                  )}
                  {item.garantia_escrow && (
                    <span className="px-2.5 py-1.5 bg-slate-950/80 backdrop-blur-sm text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                      🔒 Escrow
                    </span>
                  )}
                </div>
              </div>

              {/* Data Box */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {item.ciudad}
                  </span>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {item.marca} <span className="text-slate-500 font-normal">{item.modelo}</span>
                  </h3>
                  
                  {/* Technical Specs List */}
                  <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-500 font-semibold uppercase">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {item.anio}</span>
                    <span className="flex items-center gap-1"><Gauge size={12} /> {item.kilometraje_km.toLocaleString()} Km</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Precio Comercial</span>
                    <p className="text-base font-black text-slate-900 tracking-tight">
                      Bs. {item.precio_bs.toLocaleString()}
                    </p>
                  </div>
                  <a 
                    href={`${getDashboardUrl()}/#product-detail?id=${item.id}`} 
                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-orange-500 hover:text-slate-950 transition-colors shadow-sm active:scale-95 duration-150"
                  >
                    <ShieldCheck size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
