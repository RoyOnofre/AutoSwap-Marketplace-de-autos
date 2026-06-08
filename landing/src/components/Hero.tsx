'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboardUrl } from '../utils/navigation';

export default function Hero() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [precio, setPrecio] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirects user to main app search with selected filters
    const query = new URLSearchParams();
    if (marca) query.append('marca', marca);
    if (modelo) query.append('modelo', modelo);
    window.location.href = `${getDashboardUrl()}/#inventory?${query.toString()}`;
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden pt-20">
      {/* Background Image with Dark Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600')` 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />

      {/* Hero Content */}
      <div className="relative w-full max-w-7xl mx-auto px-6 z-10 py-20 flex flex-col items-start text-left space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4 max-w-3xl"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs font-black uppercase tracking-wider">
            ★ Garantía Escrow & KYC Activos
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tight">
            La nueva era de<br />
            <span className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tight">
              intercambio de autos
            </span> <br />
            en Bolivia
          </h1>
          <p className="text-slate-350 text-sm md:text-base leading-relaxed font-semibold max-w-2xl">
            Plataforma profesional con inspección técnica certificada, pagos seguros mediante Escrow y verificación de identidad (KYC) para transacciones 100% confiables.
          </p>
        </motion.div>

        {/* Glassmorphic Search Bar */}
        <motion.form 
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-[32px] p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center gap-4"
        >
          {/* Marca Selector */}
          <div className="w-full flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
            <select 
              value={marca} 
              onChange={(e) => setMarca(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="" className="bg-slate-900 text-white">Todas las marcas</option>
              <option value="Toyota" className="bg-slate-900 text-white">Toyota</option>
              <option value="Suzuki" className="bg-slate-900 text-white">Suzuki</option>
              <option value="Nissan" className="bg-slate-900 text-white">Nissan</option>
              <option value="Mitsubishi" className="bg-slate-900 text-white">Mitsubishi</option>
            </select>
          </div>

          {/* Modelo Input */}
          <div className="w-full flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
            <input 
              type="text" 
              placeholder="Ej. Land Cruiser, Jimny..." 
              value={modelo} 
              onChange={(e) => setModelo(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-xs font-bold placeholder:text-slate-500 focus:outline-none focus:border-orange-500transition-colors"
            />
          </div>

          {/* Rango de Precio Selector */}
          <div className="w-full flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rango de Precio</label>
            <select 
              value={precio} 
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="" className="bg-slate-900 text-white">Cualquier precio</option>
              <option value="bajo" className="bg-slate-900 text-white">Menos de Bs. 80,000</option>
              <option value="medio" className="bg-slate-900 text-white">Bs. 80,000 - 140,000</option>
              <option value="alto" className="bg-slate-900 text-white">Más de Bs. 140,000</option>
            </select>
          </div>

          {/* Search Button */}
          <button 
            type="submit"
            className="w-full md:w-auto self-end bg-orange-500 hover:bg-orange-450 text-slate-950 font-black px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-orange-500/20 uppercase tracking-wider text-xs"
          >
            <Search size={16} />
            Buscar
          </button>
        </motion.form>

        {/* Stats Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center gap-8 md:gap-16 pt-4 text-left"
        >
          <div>
            <p className="text-2xl font-black text-white tracking-tight">2,500+</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vehículos Vendidos</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white tracking-tight">100%</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Garantía Escrow</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white tracking-tight">Bs. 140K</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Umbral Inspección</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
