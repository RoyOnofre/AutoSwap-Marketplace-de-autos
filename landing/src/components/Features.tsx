'use client';

import React from 'react';
import { ShieldCheck, Handshake, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Features() {
  const pillars = [
    {
      icon: <ClipboardCheck size={28} />,
      title: "Inspección Certificada",
      description: "Validación mecánica y legal obligatoria por inspectores de AutoSwap para todo vehículo con precio mayor o igual a Bs. 140,000, eliminando sorpresas o vicios ocultos."
    },
    {
      icon: <Handshake size={28} />,
      title: "Pagos Seguros (Escrow)",
      description: "Los fondos del comprador se depositan en una cuenta de garantía de AutoSwap y se liberan al vendedor únicamente cuando ambas partes confirman la transferencia de propiedad."
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Verificación KYC Completa",
      description: "Todos los compradores y vendedores pasan por un proceso digital estricto de validación de identidad para asegurar transacciones con personas reales y de confianza."
    }
  ];

  return (
    <section id="como-funciona" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-black tracking-widest text-emerald-500 uppercase">
            El Estándar AutoSwap
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
            Intercambios sin riesgos y 100% garantizados
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Hemos redefinido el mercado de autos usados en Bolivia incorporando las tecnologías de seguridad financiera y verificación de identidad más avanzadas.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm hover:shadow-md hover:border-slate-200 transition-all space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-sm">
                  {p.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {p.title}
                </h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  {p.description}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Estándar AutoSwap Activo
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
