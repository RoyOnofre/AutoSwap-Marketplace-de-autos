'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getDashboardUrl } from '../utils/navigation';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-900 text-white" id="cta">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-black mb-6"
        >
          ¿Listo para tu próximo intercambio?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-300 mb-8"
        >
          Únete a la comunidad de AutoSwap y descubre un proceso seguro, rápido y sin sorpresas.
        </motion.p>
        <motion.a
          href={`${getDashboardUrl()}/#login`}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg"
        >
          Iniciar Sesión <ArrowRight size={20} />
        </motion.a>
      </div>
    </section>
  );
}
