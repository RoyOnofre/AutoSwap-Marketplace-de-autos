'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Handshake } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: <ShieldCheck size={32} className="text-emerald-500" />,
      title: 'Inspección Certificada',
      description: 'Cada vehículo supera una inspección técnica rigurosa para garantizar su estado y seguridad.',
    },
    {
      icon: <Zap size={32} className="text-amber-500" />,
      title: 'Pagos Escrow',
      description: 'Los fondos se liberan solo cuando ambas partes confirman la entrega satisfactoria.',
    },
    {
      icon: <Handshake size={32} className="text-indigo-500" />,
      title: 'KYC y Seguridad',
      description: 'Verificación de identidad para crear un entorno confiable y libre de fraudes.',
    },
  ];

  return (
    <section className="py-20 bg-slate-950/30 backdrop-blur-sm" id="beneficios">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-black text-center text-white mb-12"
        >
          Por qué elegir AutoSwap
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 text-center border border-slate-700"
            >
              <div className="flex justify-center mb-4">{b.icon}</div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
