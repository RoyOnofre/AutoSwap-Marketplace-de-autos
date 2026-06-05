import React, { useState } from 'react';
import { User, Mail, Lock, ArrowLeft, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from "../api";

interface RegisterScreenProps {
  onBack: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    rol: 'comprador',
    contrasena: '',
    confirmar: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (formData.contrasena !== formData.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.registrar(
        `${formData.nombre} ${formData.apellido}`.trim(),
        formData.correo,
        formData.contrasena,
        formData.rol
      );
      setSuccess(true);
      setTimeout(() => onBack(), 2500);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err.message || JSON.stringify(err) || 'Error al crear la cuenta');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-background-dark tech-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto glow-shadow">
            <CheckCircle2 className="text-background-dark" size={48} />
          </div>
          <h2 className="text-4xl font-black text-white">¡Cuenta Creada!</h2>
          <p className="text-slate-400 text-lg">Tu usuario fue guardado en la base de datos de Supabase.</p>
          <p className="text-primary font-bold">Redirigiendo al login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-background-dark tech-pattern">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl glass-panel p-10 rounded-3xl relative glow-shadow"
      >
        <button
          onClick={onBack}
          className="absolute left-8 top-8 p-2 hover:bg-primary/10 rounded-full transition-colors text-primary"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Crear Nueva Cuenta</h1>
          <p className="text-slate-400 mt-2">Se registrará en la plataforma AutoSwap</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s ? 'bg-primary text-background-dark glow-shadow' : 'bg-surface-dark text-slate-500 border border-primary/10'
                }`}>
                  {step > s ? <CheckCircle2 size={20} /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-surface-dark'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleNext}>
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input name="nombre" type="text" value={formData.nombre} onChange={handleChange}
                      placeholder="Juan" className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-white" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Apellido</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input name="apellido" type="text" value={formData.apellido} onChange={handleChange}
                      placeholder="Pérez" className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-white" required />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input name="correo" type="email" value={formData.correo} onChange={handleChange}
                    placeholder="juan.perez@ejemplo.com" className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-white" required />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Tipo de Rol en AutoSwap</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, rol: 'comprador' }))}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${formData.rol === 'comprador' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/10 bg-background-dark/50 text-slate-400 hover:border-primary/30'}`}>
                    <UserCheck size={32} />
                    <span className="font-bold uppercase text-sm">Comprador</span>
                    <span className="text-[10px] text-center opacity-70">Buscar y comprar autos</span>
                  </button>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, rol: 'vendedor' }))}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${formData.rol === 'vendedor' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/10 bg-background-dark/50 text-slate-400 hover:border-primary/30'}`}>
                    <User size={32} />
                    <span className="font-bold uppercase text-sm">Vendedor</span>
                    <span className="text-[10px] text-center opacity-70">Publicar y vender autos</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">Rol seleccionado: <span className="text-primary font-bold">{formData.rol === 'comprador' ? 'Comprador' : 'Vendedor'}</span></p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input name="contrasena" type="password" value={formData.contrasena} onChange={handleChange}
                    placeholder="Mínimo 6 caracteres" className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-white" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input name="confirmar" type="password" value={formData.confirmar} onChange={handleChange}
                    placeholder="Repite la contraseña" className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-white" required />
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background-dark font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all glow-shadow mt-10 disabled:opacity-50"
          >
            {loading ? 'Guardando en Supabase...' : step === 3 ? 'Crear Cuenta' : 'Siguiente Paso'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;
