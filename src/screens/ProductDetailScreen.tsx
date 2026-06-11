import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, XCircle, ShieldCheck, HelpCircle, 
  MapPin, Calendar, Gauge, Key, Fuel, Hash, User, Phone, RefreshCw, 
  FileText, Shield, ArrowRight, Sparkles, CheckSquare, AlertCircle, Star
} from 'lucide-react';
import { api } from "../api";
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { RatingModal } from '../components/RatingModal';
import { toast } from 'react-hot-toast';

interface ProductDetailScreenProps {
  productId: string;
  userRole: UserRole;
  currentUser?: any;
  onBack: () => void;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ productId, userRole, currentUser, onBack }) => {
  const [vehicle, setVehicle] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // States for Inspector / Admin validation panel
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState('');
  const [validationError, setValidationError] = useState('');

  // States for Buyer purchase panel (Escrow)
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState(0); // 0: Idle, 1: Creando Transacción, 2: Pago en Custodia, 3: Simulación Webhook, 4: Éxito
  const [purchaseError, setPurchaseError] = useState('');
  const [transaccionId, setTransaccionId] = useState('');
  const [showRating, setShowRating] = useState(false);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const found = await api.getVehiculoDetail(productId);
      if (found) {
        setVehicle(found);
        if (found.vendedor_id) {
          try {
            const sellerProfile = await api.obtenerPerfil(found.vendedor_id);
            setSeller(sellerProfile);
          } catch (err) {
            console.error("Error al obtener perfil del vendedor:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando detalles del vehículo por ID, usando fallback:", error);
      try {
        const list = await api.getVehiculos();
        const found = list.find((v: any) => v.id === productId);
        if (found) {
          setVehicle(found);
          if (found.vendedor_id) {
            try {
              const sellerProfile = await api.obtenerPerfil(found.vendedor_id);
              setSeller(sellerProfile);
            } catch (err) {
              console.error("Error al obtener perfil del vendedor en fallback:", err);
            }
          }
        }
      } catch (fallbackErr) {
        console.error("Error en fallback cargando detalles del vehículo:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [productId]);

  // Handler for Admin/Inspector validation
  const handleValidate = async (accion: 'aprobado' | 'rechazado') => {
    if (accion === 'rechazado' && !rejectionReason.trim()) {
      setValidationError('Por favor escribe un motivo para el rechazo.');
      return;
    }

    setIsValidating(true);
    setValidationError('');
    try {
      if (accion === 'aprobado') {
        await api.validarVehiculo(productId, 'aprobado');
      } else {
        await api.validarVehiculo(productId, 'rechazado', rejectionReason.trim());
      }
      setValidationSuccess(`Vehículo ${accion === 'aprobado' ? 'aprobado' : 'rechazado'} exitosamente.`);
      setRejectionReason('');
      setShowRejectForm(false);
      // Reload details after validation
      await fetchVehicleDetails();
    } catch (err: any) {
      setValidationError(err.message || 'Error al validar el vehículo.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handler for Buyer Escrow Purchase
  const handleStartPurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError('');
    setPurchaseStep(1); // 1. Creando Transacción

    try {
      const res = await api.comprarVehiculo(productId, "QR");
      setTransaccionId(res.codigo_transaccion);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPurchaseStep(2); // Pago en Custodia
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPurchaseStep(3); // Simulación Webhook
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPurchaseStep(4); // Éxito
      
      setVehicle((prev: any) => prev ? { ...prev, estado_venta: 'vendido' } : null);
      toast.success('¡Compra registrada exitosamente!');
    } catch (err: any) {
      console.error("Error al procesar la compra:", err);
      setPurchaseError(err.message || 'Error al procesar la compra.');
      setPurchaseStep(0);
      setIsPurchasing(false);
      toast.error(err.message || 'Error al procesar la compra.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="animate-spin text-primary w-12 h-12" />
        <p className="text-slate-400 font-bold">Cargando expediente del vehículo...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8 text-center space-y-6">
        <AlertCircle className="mx-auto text-rose-500 w-16 h-16" />
        <h2 className="text-2xl font-bold text-white">Vehículo No Encontrado</h2>
        <p className="text-slate-400 max-w-md mx-auto">No pudimos encontrar el vehículo seleccionado en la base de datos de Supabase.</p>
        <button onClick={onBack} className="px-6 py-3 bg-primary text-background-dark font-bold rounded-2xl">
          Volver al Catálogo
        </button>
      </div>
    );
  }

  // Formatting values
  const formattedPrice = vehicle.precio_clp ? vehicle.precio_clp.toLocaleString() : '0';
  const formattedMileage = vehicle.kilometraje_km ? vehicle.kilometraje_km.toLocaleString() : '0';
  const photosList = (vehicle.fotos && vehicle.fotos.length > 0) 
    ? vehicle.fotos.map((f: any) => f.ruta_almacenamiento)
    : ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'];

  const isApproved = vehicle.estado_validacion === 'aprobado';
  const isPending = vehicle.estado_validacion === 'pendiente';
  const isRejected = vehicle.estado_validacion === 'rechazado';
  const isSold = vehicle.estado_venta === 'vendido';

  const canValidate = userRole === 'admin' || userRole === 'inspector';
  const canBuy = userRole === 'comprador';

  const sellerName = vehicle.vendedor_nombre || seller?.name || 'Desconocido';
  const sellerPhone = vehicle.vendedor_celular || seller?.phone || 'N/A';
  const sellerZona = vehicle.vendedor_zona || seller?.address || 'N/A';
  const sellerAvatar = seller?.avatar || null;
  const sellerInitials = (sellerName || 'V').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-bold"
        >
          <ArrowLeft size={18} />
          Volver al Catálogo
        </button>

        {/* Validation Status Badge */}
        <div>
          {isSold ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-black uppercase tracking-wider">
              <CheckCircle size={14} /> Vendido
            </span>
          ) : isApproved ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-wider">
              <CheckCircle size={14} /> Certificado & Activo
            </span>
          ) : isPending ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-wider">
              <RefreshCw size={14} className="animate-spin" /> Pendiente de Revisión
            </span>
          ) : isRejected ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-black uppercase tracking-wider">
              <XCircle size={14} /> Rechazado
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Main Gallery, Title, Description, Technical Spec sheet (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Photo Gallery Box */}
          <div className="glass-panel p-6 rounded-[32px] border border-primary/10 space-y-4">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 bg-background-dark/80 relative">
              <img 
                src={photosList[activePhotoIdx]} 
                alt={`${vehicle.marca} ${vehicle.modelo}`} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {photosList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1 scrollbar-hide">
                {photosList.map((photo: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-24 h-16 rounded-xl overflow-hidden border shrink-0 transition-all ${idx === activePhotoIdx ? 'border-primary scale-105 shadow-[0_0_10px_rgba(var(--primary-color),0.3)]' : 'border-slate-800 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={photo} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Information Box */}
          <div className="glass-panel p-8 rounded-[40px] border border-primary/10 space-y-6">
            <div>
              <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-lg">
                {vehicle.categoria}
              </span>
              <h1 className="text-4xl font-black text-white tracking-tight mt-4 uppercase">
                {vehicle.marca} <span className="text-primary">{vehicle.modelo}</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">UUID: {vehicle.id}</p>
            </div>

            <div className="border-t border-slate-850 pt-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">Descripción General</h3>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {vehicle.descripcion}
              </p>
            </div>

            {/* Technical Spec sheet */}
            <div className="border-t border-slate-850 pt-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Ficha Técnica Certificada</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SpecItem icon={<Calendar size={16} />} label="Año" value={vehicle.anio} />
                <SpecItem icon={<Gauge size={16} />} label="Kilometraje" value={`${formattedMileage} Km`} />
                <SpecItem icon={<Hash size={16} />} label="Patente / Placa" value={vehicle.patente || 'S/P'} />
                <SpecItem icon={<Key size={16} />} label="Transmisión" value={vehicle.transmision} />
                <SpecItem icon={<Fuel size={16} />} label="Combustible" value={vehicle.tipo_combustible} />
                <SpecItem icon={<MapPin size={16} />} label="Ubicación" value={`${vehicle.ciudad}, ${vehicle.region}`} />
              </div>
            </div>
{/* Seller Contact */}
<div className="border-t border-slate-850 pt-4 mt-4">
  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Información de Contacto del Vendedor</h3>
  <div className="flex items-center gap-3 mt-1">
    <User className="text-primary" size={16} />
    <span className="text-xs text-slate-400">{sellerName}</span>
  </div>
  <div className="flex items-center gap-3 mt-1">
    <Phone className="text-primary" size={16} />
    <span className="text-xs text-slate-400">{sellerPhone}</span>
  </div>
  <div className="flex items-center gap-3 mt-1">
    <MapPin className="text-primary" size={16} />
    <span className="text-xs text-slate-400">{sellerZona}</span>
  </div>
</div>

            {/* If vehicle is rejected, show rejection motive */}
            {isRejected && vehicle.motivo_rechazo && (
              <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-3xl space-y-2">
                <h4 className="text-xs font-black text-rose-400 flex items-center gap-2">
                  <XCircle size={16} /> Motivo del Rechazo Técnico
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold italic">
                  "{vehicle.motivo_rechazo}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Actions Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-8 sticky top-8">
          
          {/* Price Box */}
          <div className="glass-panel p-8 rounded-[40px] border border-primary/10 text-center space-y-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Valor Comercial</span>
            <div className="text-4xl font-black text-white tracking-tighter">
              Bs. <span className="text-primary">{formattedPrice}</span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Garantía Escrow AutoSwap Activa</p>
          </div>

          {/* Seller Card (Vendido por) */}
          {(seller || vehicle.vendedor_nombre) && (
            <div className="glass-panel p-6 rounded-[32px] border border-primary/10 space-y-4 animate-in fade-in duration-300">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Información del Vendedor</span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden shrink-0">
                  {sellerAvatar ? (
                    <img src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    sellerInitials
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                    {sellerName}
                  </h4>
                  <p className="text-[10px] text-slate-400 capitalize">Vendedor Certificado</p>
                  <p className="text-[10px] text-slate-400 capitalize">Teléfono: {sellerPhone}</p>
                  <p className="text-[10px] text-slate-400 capitalize">Zona: {sellerZona}</p>
                </div>
              </div>
              <div className="border-t border-slate-850 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-450 font-bold">Reputación:</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => {
                      const val = i + 1;
                      const average = seller?.calificacion_promedio || vehicle.vendedor_calificacion_promedio || 0.0;
                      return (
                        <Star 
                          key={i} 
                          size={13} 
                          className={val <= Math.round(average) ? "fill-amber-400 text-amber-400 animate-pulse" : "text-slate-700"} 
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-black text-white">
                    {(seller?.calificacion_promedio || vehicle.vendedor_calificacion_promedio || 0) > 0 
                      ? (seller?.calificacion_promedio || vehicle.vendedor_calificacion_promedio || 0).toFixed(1) 
                      : 'Nuevo'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Panel for Inspectors & Admins */}
          {canValidate && (
            <div className="glass-panel p-8 rounded-[40px] border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.05)] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Certificación</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Panel de Validación Técnica</p>
                </div>
              </div>

              {validationError && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-2xl text-xs text-rose-400 font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {validationError}
                </div>
              )}

              {validationSuccess && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle size={16} /> {validationSuccess}
                </div>
              )}

              {isPending ? (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Como certificador autorizado, evalúa si la descripción y fotos corresponden a las condiciones reales de la plataforma.
                  </p>

                  <button
                    onClick={() => handleValidate('aprobado')}
                    disabled={isValidating}
                    className="w-full bg-emerald-500 text-background-dark font-black py-4 rounded-2xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    {isValidating ? 'Procesando...' : 'Aprobar Publicación'}
                  </button>

                  {!showRejectForm ? (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isValidating}
                      className="w-full bg-background-dark border border-rose-500/20 text-rose-400 font-black py-4 rounded-2xl hover:bg-rose-500/10 active:scale-95 transition-all"
                    >
                      Rechazar Publicación
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-in slide-in-from-top-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Motivo de Rechazo</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ej. La descripción no detalla el kilometraje de forma consistente, o requiere fotos adicionales."
                        className="w-full bg-background-dark/50 border border-primary/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary text-xs h-24 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValidate('rechazado')}
                          disabled={isValidating}
                          className="flex-1 bg-rose-500 text-white font-black py-3 rounded-xl hover:bg-rose-600 transition-all text-xs"
                        >
                          Confirmar Rechazo
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          className="px-4 bg-background-dark border border-slate-800 text-slate-400 rounded-xl hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-surface-dark border border-white/5 rounded-2xl text-center">
                    <p className="text-xs text-slate-400 font-semibold">Este anuncio ya se encuentra validado y certificado.</p>
                    <p className="text-xs text-primary font-black uppercase mt-2">{vehicle.estado_validacion}</p>
                  </div>
                  {/* Option to re-verify if needed */}
                  <button 
                    onClick={() => {
                      // Simula reseteo a pendiente
                      setVehicle({ ...vehicle, estado_validacion: 'pendiente' });
                    }}
                    className="w-full text-xs text-slate-500 font-bold hover:text-white transition-colors py-2 flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={12} /> Cambiar Estado de Certificación
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Buyer Escrow Purchase Panel */}
          {canBuy && (
            <div className="glass-panel p-8 rounded-[40px] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Compra Segura</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Protección Escrow AutoSwap</p>
                </div>
              </div>

              {isSold ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-xs text-emerald-400 font-semibold leading-relaxed text-center">
                  Este vehículo esta en aceptacion de respuesta y su pago está en custodia segura.
                </div>
              ) : !isApproved ? (
                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs text-amber-400 font-semibold leading-relaxed">
                  Este anuncio está en revisión técnica por nuestros inspectores. Podrás adquirirlo una vez que sea aprobado y certificado.
                </div>
              ) : !isPurchasing ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Tus fondos serán retenidos en una cuenta de garantía de AutoSwap. El vendedor recibirá el dinero únicamente cuando confirmes que el auto se ha transferido legalmente.
                  </p>
                  <button
                    onClick={handleStartPurchase}
                    className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl hover:bg-blue-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 text-sm tracking-wide"
                  >
                    Iniciar Compra Segura
                  </button>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest text-center border-b border-slate-800 pb-2">Estado de tu Transacción</h4>
                  
                  <div className="space-y-4">
                    <PurchaseProgressStep step={1} currentStep={purchaseStep} label="Creando contrato de custodia (Gateway)..." />
                    <PurchaseProgressStep step={2} currentStep={purchaseStep} label="Procesando pago mediante QR_BANCO..." />
                    <PurchaseProgressStep step={3} currentStep={purchaseStep} label="Confirmando liberación de webhook escrow..." />
                    <PurchaseProgressStep step={4} currentStep={purchaseStep} label="¡Pago asegurado en escrow con éxito!" />
                  </div>

                  {purchaseStep === 4 && (
                    <div className="pt-2 space-y-3 animate-in zoom-in-95">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-400 text-center font-bold">
                        Transacción exitosa: {transaccionId}
                      </div>
                      <button 
                        onClick={() => setShowRating(true)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-background-dark text-xs font-black py-3 rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
                      >
                        <Star size={14} className="fill-background-dark" />
                        Calificar Vendedor
                      </button>
                      <button 
                        onClick={() => {
                          setIsPurchasing(false);
                          setPurchaseStep(0);
                        }}
                        className="w-full bg-slate-800 text-white text-xs font-black py-3 rounded-xl hover:bg-slate-750 transition-all uppercase"
                      >
                        Finalizar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vendedor Panel */}
          {userRole === 'vendedor' && (
            <div className="glass-panel p-8 rounded-[40px] border border-emerald-500/20 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Tu Publicación</h3>
              {isPending && (
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Tu vehículo está siendo revisado por nuestro equipo de inspectores técnicos en Bolivia. Te avisaremos por correo una vez que sea aprobado para venta directa.
                </p>
              )}
              {isApproved && (
                <p className="text-xs text-emerald-400/90 leading-relaxed font-semibold">
                  ¡Felicidades! Tu publicación está certificada y visible para compradores en Bolivia.
                </p>
              )}
              {isRejected && (
                <div className="space-y-2">
                  <p className="text-xs text-rose-400 leading-relaxed font-semibold">
                    Tu anuncio requiere correcciones técnicas. Revisa el motivo e introduce los cambios en tu perfil.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      {seller && (
        <RatingModal 
          isOpen={showRating} 
          onClose={() => setShowRating(false)} 
          vendedorId={seller.id}
          onSuccess={(nuevoPromedio) => {
            setSeller((prev: any) => prev ? { ...prev, calificacion_promedio: nuevoPromedio } : null);
          }}
        />
      )}
    </div>
  );
};

const SpecItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) => (
  <div className="p-4 bg-background-dark/40 border border-primary/5 rounded-2xl flex items-start gap-3">
    <div className="text-primary mt-0.5">{icon}</div>
    <div>
      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{label}</span>
      <span className="text-xs font-bold text-white uppercase mt-0.5 block">{value}</span>
    </div>
  </div>
);

const PurchaseProgressStep = ({ step, currentStep, label }: { step: number, currentStep: number, label: string }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;
  const isPending = currentStep < step;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
        isCompleted ? 'bg-emerald-500 text-background-dark' :
        isActive ? 'bg-blue-500 text-white animate-pulse' :
        'bg-background-dark border border-slate-800 text-slate-600'
      }`}>
        {isCompleted ? '✓' : step}
      </div>
      <span className={`text-[11px] font-bold ${
        isCompleted ? 'text-slate-400 line-through' :
        isActive ? 'text-blue-400 font-black' :
        'text-slate-600'
      }`}>{label}</span>
    </div>
  );
};

export default ProductDetailScreen;
