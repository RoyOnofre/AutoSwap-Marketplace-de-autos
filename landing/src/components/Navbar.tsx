'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Car } from 'lucide-react';
import { getDashboardUrl } from '../utils/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-350 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-105 transition-all">
            <Car size={20} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Auto<span className="text-orange-500">Swap</span>
            <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase tracking-widest">Bolivia</span>
          </span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#inventario" className="text-sm font-semibold text-slate-650 hover:text-slate-900 transition-colors">Explorar Autos</a>
          <a href="#como-funciona" className="text-sm font-semibold text-slate-650 hover:text-slate-900 transition-colors">Cómo Funciona</a>
          <a href="#beneficios" className="text-sm font-semibold text-slate-650 hover:text-slate-900 transition-colors">Vender</a>
          <a href="#seguridad" className="text-sm font-semibold text-slate-650 hover:text-slate-900 transition-colors">Seguridad</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a 
            href={`${getDashboardUrl()}/#login`} 
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-3 rounded-xl transition-all shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 uppercase tracking-wider"
          >
            Iniciar Sesión
          </a>
          <a 
            href={`${getDashboardUrl()}/#add-product`} 
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-3 rounded-xl transition-all shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 uppercase tracking-wider"
          >
            Publicar Auto
          </a>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl py-6 px-6 space-y-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4">
            <a 
              href="#inventario" 
              onClick={() => setIsOpen(false)}
              className="text-base font-bold text-slate-750 hover:text-slate-900 transition-colors"
            >
              Explorar Autos
            </a>
            <a 
              href="#como-funciona" 
              onClick={() => setIsOpen(false)}
              className="text-base font-bold text-slate-750 hover:text-slate-900 transition-colors"
            >
              Cómo Funciona
            </a>
            <a 
              href="#beneficios" 
              onClick={() => setIsOpen(false)}
              className="text-base font-bold text-slate-750 hover:text-slate-900 transition-colors"
            >
              Vender
            </a>
            <a 
              href="#seguridad" 
              onClick={() => setIsOpen(false)}
              className="text-base font-bold text-slate-750 hover:text-slate-900 transition-colors"
            >
              Seguridad
            </a>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            <a 
              href={`${getDashboardUrl()}/#login`} 
              className="text-center font-bold text-slate-700 hover:text-slate-900 py-2.5 rounded-xl border border-slate-200 transition-colors"
            >
              Iniciar Sesión
            </a>
            <a 
              href={`${getDashboardUrl()}/#add-product`} 
              className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl text-center transition-all uppercase tracking-wider text-xs shadow-md"
            >
              Publicar Auto
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
