import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Car, UserCheck, ShieldCheck, ClipboardCheck, X, CheckCircle2, Eye, EyeOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { api } from '../api';

interface LoginScreenProps {
  onLogin: (role: UserRole, userData?: any) => void;
  onRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [correo, setCorreo] = useState('admin@autoswap.bo');
  const [contrasena, setContrasena] = useState('admin123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Reset contraseña
  const [showReset, setShowReset] = useState(false);
  const [resetCorreo, setResetCorreo] = useState('');
  const [resetNueva, setResetNueva] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  const getDemoEmail = (role: UserRole) => `${role}@autoswap.bo`;

  const selectDemoRole = (role: UserRole) => {
    setSelectedRole(role);
    setCorreo(getDemoEmail(role));
    setContrasena(`${role}123`);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNueva.length < 6) { setResetError('Mínimo 6 caracteres'); return; }
    setResetLoading(true); setResetError('');
    try {
      await api.resetContrasena(resetCorreo, resetNueva);
      setResetSuccess(true);
      setTimeout(() => { setShowReset(false); setResetSuccess(false); }, 2000);
    } catch (err: any) { setResetError(err.message || 'Correo no encontrado'); }
    finally { setResetLoading(false); }
  };

  // Función blindada: SIEMPRE devuelve un string plano, JAMÁS un objeto
  const safeErrorMessage = (err: any): string => {
    if (!err) return 'Error al iniciar sesión';
    if (typeof err === 'string') return err;
    
    // Si tiene propiedad message/detail que es string
    if (err.message && typeof err.message === 'string') return err.message;
    if (err.detail && typeof err.detail === 'string') return err.detail;
    
    // Axios / Fetch JSON response data
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === 'string') return data;
      if (data.message && typeof data.message === 'string') return data.message;
      if (data.detail && typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.message)) return data.message.join(', ');
      if (data.message && typeof data.message === 'object') {
        return data.message.detail || data.message.message || JSON.stringify(data.message);
      }
    }

    // Si err.message existe pero es un objeto
    if (err.message && typeof err.message === 'object') {
      const msgObj = err.message;
      if (typeof msgObj.detail === 'string') return msgObj.detail;
      if (typeof msgObj.message === 'string') return msgObj.message;
    }

    try {
      const str = JSON.stringify(err);
      if (str && str !== '{}') return str;
    } catch (e) {}

    const stringified = String(err);
    if (stringified === '[object Object]') {
      if (err.message) return String(err.message);
      return 'Error de comunicación con el Gateway/Backend';
    }
    return stringified;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const data = await api.login(correo, contrasena);
      // Guardar información del usuario
      localStorage.setItem(`profile_${data.usuario.rol}`, JSON.stringify(data.usuario));
      onLogin(data.usuario.rol as UserRole, data.usuario);
    } catch (err: unknown) {
      console.error('⚠️ ERROR CAPTURADO EN LOGIN WEB:', err);
      console.error('⚠️ typeof err:', typeof err);
      console.error('⚠️ err instanceof Error:', err instanceof Error);
      if (err && typeof err === 'object') {
        console.error('⚠️ err.message:', (err as any).message);
        console.error('⚠️ err.response:', (err as any).response);
        console.error('⚠️ JSON.stringify(err):', JSON.stringify(err));
      }
      const msg = safeErrorMessage(err);
      console.error('⚠️ MENSAJE FINAL PARA EL BANNER:', msg);
      setError(typeof msg === 'string' ? msg : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'vendedor': return 'Vendedor';
      case 'comprador': return 'Comprador';
      case 'inspector': return 'Inspector';
      default: return role;
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-background-dark/85 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-10 rounded-3xl relative z-10 glow-shadow"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 glow-shadow">
            <Car className="text-background-dark animate-pulse" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Auto<span className="text-primary font-bold">Swap</span></h1>
          <p className="text-slate-400 mt-2 text-sm text-center">Marketplace de autos usados en Bolivia</p>
        </div>

        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block text-center">Seleccionar Rol de Demo</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => selectDemoRole('admin')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${selectedRole === 'admin' ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark/50 border-primary/10 text-slate-400 hover:border-primary/30'}`}
            >
              <ShieldCheck size={18} />
              <span className="text-[11px] font-bold uppercase">Admin</span>
            </button>
            <button 
              type="button"
              onClick={() => selectDemoRole('vendedor')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${selectedRole === 'vendedor' ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark/50 border-primary/10 text-slate-400 hover:border-primary/30'}`}
            >
              <User size={18} />
              <span className="text-[11px] font-bold uppercase">Vendedor</span>
            </button>
            <button 
              type="button"
              onClick={() => selectDemoRole('comprador')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${selectedRole === 'comprador' ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark/50 border-primary/10 text-slate-400 hover:border-primary/30'}`}
            >
              <UserCheck size={18} />
              <span className="text-[11px] font-bold uppercase">Comprador</span>
            </button>
            <button 
              type="button"
              onClick={() => selectDemoRole('inspector')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${selectedRole === 'inspector' ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark/50 border-primary/10 text-slate-400 hover:border-primary/30'}`}
            >
              <ClipboardCheck size={18} />
              <span className="text-[11px] font-bold uppercase">Inspector</span>
            </button>
          </div>
        </div>

        {error && typeof error === 'string' && error !== '' && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
            {error === '[object Object]' ? 'Error de conexión con el Gateway/Backend' : error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input 
                type="email" 
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder={getDemoEmail(selectedRole)}
                className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-medium text-slate-300">Contraseña</label>
              <button type="button" onClick={() => { setShowReset(true); setResetError(''); setResetSuccess(false); setResetCorreo(''); setResetNueva(''); }} className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input 
                type="password" 
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background-dark/50 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background-dark font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all glow-shadow mt-2 disabled:opacity-50"
          >
            {loading ? 'Conectando...' : `Iniciar Sesión como ${getRoleLabel(selectedRole)}`}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            ¿No tienes una cuenta? {' '}
            <button onClick={onRegister} className="text-primary font-semibold hover:underline">Regístrate ahora</button>
          </p>
        </div>
      </motion.div>

      {/* Modal Reset Contraseña */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-dark border border-primary/20 rounded-3xl w-full max-w-sm p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">🔑 Restablecer Contraseña</h3>
                <button onClick={() => setShowReset(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-primary/10 transition-all"><X size={18}/></button>
              </div>
              {resetSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="text-emerald-400" size={40}/>
                  <p className="text-white font-semibold">¡Contraseña actualizada!</p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  {resetError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">{resetError}</div>}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Correo registrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16}/>
                      <input type="email" value={resetCorreo} onChange={e => setResetCorreo(e.target.value)}
                        placeholder="correo@autoswap.bo" required
                        className="input-field pl-9"/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Nueva contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16}/>
                      <input type={mostrarPass ? 'text' : 'password'} value={resetNueva} onChange={e => setResetNueva(e.target.value)}
                        placeholder="Mínimo 6 caracteres" required
                        className="input-field pl-9 pr-9"/>
                      <button type="button" onClick={() => setMostrarPass(!mostrarPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                        {mostrarPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={resetLoading} className="w-full bg-primary text-background-dark font-bold py-3 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 text-sm">
                    {resetLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
