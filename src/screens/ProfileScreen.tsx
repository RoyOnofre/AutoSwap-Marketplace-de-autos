import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Shield, Camera, Save, Lock, Bell, Globe, CheckCircle2, FileText, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, User } from '../types';
import { api } from '../api';

interface ProfileScreenProps {
  userRole: UserRole;
  currentUser: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userRole, currentUser }) => {
  const [user, setUser] = useState<User>({
    id: currentUser.id || '0',
    name: currentUser.name || 'Usuario',
    email: currentUser.email || '',
    role: userRole,
    status: 'Activo',
    lastLogin: 'Ahora',
    initials: currentUser.initials || 'U',
    kyc_estado: (localStorage.getItem('kyc_estado') as any) || 'Pendiente' // default mockup
  });
  
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences' | 'kyc'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // KYC specific states
  const [ciFront, setCiFront] = useState<string | null>(null);
  const [ciBack, setCiBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  // Additional state for preferences and security
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('Español (Bolivia)');
  const [timezone, setTimezone] = useState('(GMT-04:00) La Paz');
  const [twoFactor, setTwoFactor] = useState(true);

  // Load full profile from Supabase on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.obtenerPerfil(user.id);
        setUser(prev => ({ ...prev, ...profile }));
        if (profile.bio) setBio(profile.bio);
        if (profile.language) setLanguage(profile.language);
        if (profile.timezone) setTimezone(profile.timezone);
        if (profile.twoFactor !== undefined) setTwoFactor(profile.twoFactor);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    if (user.id && user.id !== '0' && user.id !== '') {
      loadProfile();
    }
  }, [user.id]);


  useEffect(() => {
    if (currentUser && currentUser.name !== 'Cargando...') {
       setUser(prev => ({
         ...prev,
         id: currentUser.id || prev.id,
         name: currentUser.name,
         email: currentUser.email,
         initials: currentUser.initials,
         avatar: currentUser.avatar
       }));
    }
  }, [currentUser]);

  const handleInputChange = (field: keyof User, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleKycFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        if (type === 'front') setCiFront(base64);
        if (type === 'back') setCiBack(base64);
        if (type === 'selfie') setSelfie(base64);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleKycSubmit = async () => {
    if (!ciFront || !ciBack || !selfie) {
      alert('Por favor, selecciona las tres imágenes solicitadas.');
      return;
    }

    setIsSubmittingKyc(true);
    try {
      const response = await api.submitKyc(user.id, ciFront, ciBack, selfie);
      // Assume response contains updated kyc status
      const newStatus = response?.kyc_estado || 'Pendiente';
      setUser(prev => ({ ...prev, kyc_estado: newStatus }));
      localStorage.setItem('kyc_estado', newStatus);
      alert('Tus documentos de identidad han sido enviados con éxito y están en revisión.');
      setCiFront(null);
      setCiBack(null);
      setSelfie(null);
    } catch (err) {
      console.error(err);
      alert('Error al subir los documentos.');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        nombre: user.name,
        correo: user.email,
        avatar: user.avatar,
        bio: bio,
        language: language,
        timezone: timezone,
        two_factor: twoFactor,
      };
      const response = await api.actualizarUsuario(user.id, payload);
      console.log('Update response:', response);
      if (response && response.usuario) {
        localStorage.setItem(`profile_${userRole}`, JSON.stringify(response.usuario));
        localStorage.setItem('userName', response.usuario.nombre || response.usuario.name);
        localStorage.setItem('userEmail', response.usuario.correo || response.usuario.email);
        localStorage.setItem('userInitials', response.usuario.iniciales || 'U');
        if (response.usuario.avatar) {
          localStorage.setItem('userAvatar', response.usuario.avatar);
        }
        window.dispatchEvent(new Event('profileUpdated'));
      }
      setShowSuccess(true);
    } catch (err) {
      console.error('Error saving changes:', err);
      // Attempt to read response text if available
      if (err instanceof Error && (err as any).response) {
        try {
          const txt = await (err as any).response.text();
          console.error('Server response:', txt);
        } catch (_) {}
      }
      alert('Error guardando los cambios en el servidor');
    } finally {
      setIsSaving(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mi <span className="text-primary">Perfil</span></h1>
          <p className="text-slate-400">Gestiona tu información personal y seguridad</p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20"
              >
                <CheckCircle2 size={18} />
                ¡Cambios guardados!
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-background-dark rounded-2xl text-sm font-black glow-shadow hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
            ) : (
              <Save size={20} />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-[40px] border border-primary/10 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-surface-dark border-4 border-primary/20 flex items-center justify-center text-primary text-4xl font-black overflow-hidden shadow-2xl">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.initials
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-3 bg-primary text-background-dark rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-10"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
              />
            </div>
            
            <h2 className="text-xl font-black text-white tracking-tight">{user.name}</h2>
            <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mt-2">{user.role}</p>
            
            <div className="mt-8 pt-8 border-t border-primary/10 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xl font-black text-white">12</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Publicados</p>
              </div>
              <div className="w-px h-8 bg-primary/10"></div>
              <div className="text-center">
                <p className="text-xl font-black text-white">100%</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Rating</p>
              </div>
            </div>
          </div>

          <nav className="glass-panel p-4 rounded-[32px] border border-primary/10 space-y-2">
            <ProfileTabButton 
              active={activeTab === 'info'} 
              onClick={() => setActiveTab('info')} 
              icon={<UserIcon size={20} />} 
              label="Información" 
            />
            <ProfileTabButton 
              active={activeTab === 'kyc'} 
              onClick={() => setActiveTab('kyc')} 
              icon={<FileText size={20} />} 
              label="Identidad (KYC)" 
            />
            <ProfileTabButton 
              active={activeTab === 'security'} 
              onClick={() => setActiveTab('security')} 
              icon={<Shield size={20} />} 
              label="Seguridad" 
            />
            <ProfileTabButton 
              active={activeTab === 'preferences'} 
              onClick={() => setActiveTab('preferences')} 
              icon={<Bell size={20} />} 
              label="Preferencias" 
            />
          </nav>
        </div>

        {/* Right: Tab Content */}
        <div className="lg:col-span-3">
          <div className="glass-panel p-10 rounded-[40px] border border-primary/10 min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Información Personal</h3>
                      <p className="text-slate-400 text-sm">Actualiza tus datos de contacto y ubicación</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ProfileInput 
                      label="Nombre Completo" 
                      icon={<UserIcon size={20} />} 
                      value={user.name} 
                      onChange={(val: string) => handleInputChange('name', val)}
                    />
                    <ProfileInput 
                      label="Correo Electrónico" 
                      icon={<Mail size={20} />} 
                      value={user.email} 
                      onChange={(val: string) => handleInputChange('email', val)}
                    />
                    <ProfileInput 
                      label="Teléfono" 
                      icon={<Phone size={20} />} 
                      value={user.phone || ''} 
                      onChange={(val: string) => handleInputChange('phone', val)}
                    />
                    <ProfileInput 
                      label="Ubicación" 
                      icon={<MapPin size={20} />} 
                      value={user.address || ''} 
                      onChange={(val: string) => handleInputChange('address', val)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Biografía / Notas</label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-5 px-6 text-white focus:outline-none focus:border-primary transition-all h-40 resize-none placeholder:text-slate-600 font-bold"
                      placeholder="Cuéntanos un poco sobre ti..."
                    ></textarea>
                  </div>
                </motion.div>
              )}

              {activeTab === 'kyc' && (
                <motion.div 
                  key="kyc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Verificación de Identidad (KYC)</h3>
                      <p className="text-slate-400 text-sm">Sube tu Cédula de Identidad boliviana para habilitar transacciones</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-6 border rounded-[24px] flex items-center gap-4 ${
                    user.kyc_estado === 'Aprobado' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                    user.kyc_estado === 'Pendiente' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
                    'bg-rose-500/5 border-rose-500/20 text-rose-400'
                  }`}>
                    {user.kyc_estado === 'Aprobado' ? <CheckCircle2 size={24} /> :
                     user.kyc_estado === 'Pendiente' ? <RefreshCw className="animate-spin" size={24} /> :
                     <XCircle size={24} />}
                    <div>
                      <h4 className="font-black text-white text-base">Estado: {user.kyc_estado}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {user.kyc_estado === 'Aprobado' ? 'Tu cuenta está totalmente verificada para vender y comprar en Bolivia.' :
                         user.kyc_estado === 'Pendiente' ? 'Nuestros agentes están validando tu Cédula de Identidad. Duración estimada: 24h.' :
                         'Tus fotos no fueron claras o no coinciden. Por favor, vuelve a intentarlo.'}
                      </p>
                    </div>
                  </div>

                  {user.kyc_estado !== 'Aprobado' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* CI Frontal */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">CI Frontal</span>
                          <div className="aspect-[4/3] bg-background-dark/30 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all rounded-3xl flex flex-col items-center justify-center p-4 text-center cursor-pointer relative overflow-hidden">
                            {ciFront ? (
                              <img src={ciFront} alt="CI Frontal" className="w-full h-full object-cover absolute inset-0" />
                            ) : (
                              <>
                                <Camera size={24} className="text-primary mb-2" />
                                <p className="text-[11px] font-black text-white">Subir Foto Frontal</p>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        </div>

                        {/* CI Reverso */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">CI Reverso</span>
                          <div className="aspect-[4/3] bg-background-dark/30 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all rounded-3xl flex flex-col items-center justify-center p-4 text-center cursor-pointer relative overflow-hidden">
                            {ciBack ? (
                              <img src={ciBack} alt="CI Reverso" className="w-full h-full object-cover absolute inset-0" />
                            ) : (
                              <>
                                <Camera size={24} className="text-primary mb-2" />
                                <p className="text-[11px] font-black text-white">Subir Foto Reverso</p>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        </div>

                        {/* Selfie */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Selfie sosteniendo CI</span>
                          <div className="aspect-[4/3] bg-background-dark/30 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all rounded-3xl flex flex-col items-center justify-center p-4 text-center cursor-pointer relative overflow-hidden">
                            {selfie ? (
                              <img src={selfie} alt="Selfie" className="w-full h-full object-cover absolute inset-0" />
                            ) : (
                              <>
                                <Camera size={24} className="text-primary mb-2" />
                                <p className="text-[11px] font-black text-white">Subir Selfie</p>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, 'selfie')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleKycSubmit}
                        disabled={isSubmittingKyc || !ciFront || !ciBack || !selfie}
                        className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl glow-shadow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isSubmittingKyc ? 'Enviando...' : 'Enviar Documentos para Revisión'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Seguridad</h3>
                      <p className="text-slate-400 text-sm">Gestiona la protección de tu cuenta</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-background-dark/30 border border-primary/10 rounded-[32px] flex items-center justify-between group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                          <Lock size={28} />
                        </div>
                        <div>
                          <p className="text-white font-black text-lg">Cambiar Contraseña</p>
                          <p className="text-sm text-slate-500">Actualiza tu contraseña regularmente para mayor seguridad</p>
                        </div>
                      </div>
                      <button className="px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all">
                        Actualizar
                      </button>
                    </div>

                    <div className="p-8 bg-background-dark/30 border border-primary/10 rounded-[32px] flex items-center justify-between group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                          <Shield size={28} />
                        </div>
                        <div>
                          <p className="text-white font-black text-lg">Autenticación de Dos Pasos</p>
                          <p className="text-sm text-slate-500">Añade una capa extra de protección a tu cuenta</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={`relative inline-block w-14 h-7 rounded-full cursor-pointer transition-colors ${twoFactor ? 'bg-primary/40' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1.5 w-4 h-4 bg-primary rounded-full glow-shadow transition-all ${twoFactor ? 'right-1.5' : 'left-1.5'}`}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div 
                  key="preferences"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Preferencias</h3>
                      <p className="text-slate-400 text-sm">Personaliza tu experiencia en el sistema</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Idioma</label>
                      <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                        <select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-primary appearance-none transition-all font-bold"
                        >
                          <option>Español (Bolivia)</option>
                          <option>English (US)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Zona Horaria</label>
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-5 px-6 text-white focus:outline-none focus:border-primary appearance-none transition-all font-bold"
                      >
                        <option>(GMT-04:00) La Paz</option>
                        <option>(GMT-05:00) New York</option>
                        <option>(UTC) London</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileTabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
      active ? 'bg-primary text-background-dark font-black glow-shadow' : 'text-slate-400 hover:bg-primary/10 hover:text-primary'
    }`}
  >
    {icon}
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

const ProfileInput = ({ label, icon, value, onChange }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary">
        {icon}
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-primary transition-all font-bold placeholder:text-slate-600"
      />
    </div>
  </div>
);

export default ProfileScreen;
