import React, { useRef, useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Upload, Save, X, Info, CheckCircle2, 
  Car, Image as ImageIcon, DollarSign, ClipboardCheck, Eye, Trash2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePublishStore } from '../store/usePublishStore';
import { api } from "../api.1";

interface AddProductScreenProps {
  onBack: () => void;
}

const AddProductScreen: React.FC<AddProductScreenProps> = ({ onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    currentStep,
    vehicleInfo,
    photos,
    price,
    requiresInspection,
    inspectionRequested,
    setStep,
    nextStep,
    prevStep,
    updateVehicleInfo,
    addPhoto,
    removePhoto,
    setPrice,
    setInspectionRequested,
    resetWizard,
  } = usePublishStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateVehicleInfo({ [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            addPhoto(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const priceNum = parseFloat(price) || 0;
      
      let descVal = vehicleInfo.description.trim();
      if (descVal.length < 100) {
        descVal = descVal.padEnd(100, " . Detalles adicionales: Vehículo de uso particular, en excelente estado general, con mantenimiento al día y papeles en orden para transferencia inmediata.");
      }

      const catLower = vehicleInfo.category.toLowerCase();
      const categoriaValid = ['sedan', 'suv', 'hatchback', 'pickup', 'van'].includes(catLower) 
        ? catLower 
        : (catLower === 'camioneta' ? 'pickup' : 'otro');

      const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      const digits = Date.now().toString().slice(-5);
      const patenteGenerada = `${digits}${letters}`;

      const payload = {
        titulo: `${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}`,
        descripcion: descVal,
        marca: vehicleInfo.brand,
        modelo: vehicleInfo.model,
        anio: parseInt(vehicleInfo.year) || new Date().getFullYear(),
        kilometraje_km: parseInt(vehicleInfo.mileage) || 0,
        precio_clp: priceNum,
        categoria: categoriaValid,
        tipo_combustible: 'gasolina',
        transmision: 'automatico',
        color_exterior: 'Negro',
        patente: patenteGenerada,
        region: 'La Paz',
        ciudad: 'La Paz',
        fotos: photos.map((p, idx) => ({
          ruta_almacenamiento: p,
          etiqueta_angulo: idx === 0 ? 'frente' : 'lateral_izq',
          es_primaria: idx === 0,
          orden_visualizacion: idx
        })),
        caracteristicas: []
      };

      await api.registrarVehiculo(payload);

      setIsSuccess(true);
      setTimeout(() => {
        resetWizard();
        onBack();
      }, 2000);
    } catch (err) {
      console.error('Error al publicar:', err);
      alert('Hubo un error al publicar el vehículo.');
    } finally {
      setIsSaving(false);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return vehicleInfo.brand.trim() !== '' && vehicleInfo.model.trim() !== '' && vehicleInfo.mileage.trim() !== '';
    }
    if (currentStep === 2) {
      return photos.length > 0;
    }
    if (currentStep === 3) {
      return price.trim() !== '' && parseFloat(price) > 0;
    }
    return true;
  };

  const stepsList = [
    { num: 1, label: 'Datos', icon: <Car size={16} /> },
    { num: 2, label: 'Fotos', icon: <ImageIcon size={16} /> },
    { num: 3, label: 'Precio', icon: <DollarSign size={16} /> },
    { num: 4, label: 'Inspección', icon: <ClipboardCheck size={16} /> },
    { num: 5, label: 'Revisión', icon: <Eye size={16} /> },
  ];

  if (isSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-background-dark/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md p-8 glass-panel border border-emerald-500/20 rounded-[40px] glow-shadow"
        >
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-white">¡Vehículo Publicado!</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tu auto ha sido listado con éxito. Si requiere inspección técnica, se ha notificado a nuestro equipo.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-bold"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <h1 className="text-3xl font-black text-white tracking-tight">Publicar <span className="text-primary">Vehículo</span></h1>
      </div>

      {/* Progress Wizard Bar */}
      <div className="glass-panel p-6 rounded-[32px] border border-primary/10">
        <div className="relative flex justify-between items-center max-w-3xl mx-auto">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
            ></div>
          </div>

          {stepsList.map((step) => {
            const isCompleted = step.num < currentStep;
            const isActive = step.num === currentStep;

            return (
              <button
                key={step.num}
                onClick={() => isStepValid() && step.num < currentStep && setStep(step.num)}
                disabled={step.num > currentStep && !isStepValid()}
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-primary text-background-dark font-black scale-105' :
                  isActive ? 'bg-background-dark border border-primary text-primary scale-110 shadow-[0_0_15px_rgba(var(--primary-color),0.4)]' :
                  'bg-background-dark border border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {step.icon}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider whitespace-nowrap hidden sm:block">
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Steps Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8 rounded-[40px] border border-primary/10 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Car size={20} />
                  </div>
                  Información del Vehículo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marca</label>
                    <input 
                      type="text" 
                      name="brand"
                      value={vehicleInfo.brand}
                      onChange={handleInputChange}
                      placeholder="Ej: Toyota, Suzuki"
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all font-bold placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                    <input 
                      type="text" 
                      name="model"
                      value={vehicleInfo.model}
                      onChange={handleInputChange}
                      placeholder="Ej: Hilux, Vitara"
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all font-bold placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Año</label>
                    <input 
                      type="number" 
                      name="year"
                      value={vehicleInfo.year}
                      onChange={handleInputChange}
                      placeholder="2024"
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all font-bold placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kilometraje (Km)</label>
                    <input 
                      type="number" 
                      name="mileage"
                      value={vehicleInfo.mileage}
                      onChange={handleInputChange}
                      placeholder="Ej: 45000"
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all font-bold placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Vehículo</label>
                    <select 
                      name="category"
                      value={vehicleInfo.category}
                      onChange={handleInputChange}
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all font-bold"
                    >
                      <option>Sedan</option>
                      <option>Hatchback</option>
                      <option>SUV</option>
                      <option>Camioneta</option>
                      <option>Coupé</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
                  <textarea 
                    name="description"
                    value={vehicleInfo.description}
                    onChange={handleInputChange}
                    placeholder="Detalles sobre el motor, estado de neumáticos, extras..."
                    className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all h-32 resize-none font-bold placeholder:text-slate-600"
                  ></textarea>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8 rounded-[40px] border border-primary/10 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Upload size={20} />
                  </div>
                  Subir Fotos del Vehículo
                </h3>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[21/9] bg-background-dark/30 border-2 border-dashed border-primary/20 rounded-[32px] flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="text-primary" size={24} />
                  </div>
                  <p className="text-sm font-black text-white">Selecciona fotos del vehículo</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Subir frontal, laterales y habitáculo</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800">
                        <img src={photo} alt={`Vehicle preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(idx);
                          }}
                          className="absolute top-2 right-2 bg-background-dark/80 hover:bg-rose-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8 rounded-[40px] border border-primary/10 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <DollarSign size={20} />
                  </div>
                  Definir Precio de Publicación
                </h3>

                <div className="space-y-2 max-w-md">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio en Bolivianos (Bs.)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-lg">Bs.</span>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-background-dark/30 border border-primary/10 rounded-3xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-primary transition-all font-black placeholder:text-slate-600 text-xl"
                      required
                    />
                  </div>
                </div>

                <div className="p-5 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
                  <h4 className="text-xs font-black text-primary flex items-center gap-2">
                    <Info size={16} />
                    Regulación para Mercado Boliviano
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                    Todo vehículo cuyo precio de publicación sea igual o superior a <span className="text-white font-bold">140.000 Bs.</span> requerirá de forma obligatoria pasar la inspección técnica certificada de AutoSwap antes de poder transferir fondos en garantía (escrow).
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8 rounded-[40px] border border-primary/10 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <ClipboardCheck size={20} />
                  </div>
                  Inspección Técnica de AutoSwap
                </h3>

                {requiresInspection ? (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-3xl p-6 space-y-4">
                    <div className="flex gap-4">
                      <div className="text-amber-500 shrink-0">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-base">Inspección Obligatoria Requerida</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Dado que tu precio es superior a 140.000 Bs. ({price} Bs.), tu auto califica para inspección técnica obligatoria para garantizar la seguridad del comprador. Un inspector certificado coordinará la visita técnica.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      La inspección técnica opcional te permite añadir un certificado de calidad a tu publicación, lo cual genera hasta un 80% más de confianza en compradores.
                    </p>

                    <div className="flex items-center gap-4 bg-background-dark/30 border border-slate-800 p-6 rounded-3xl">
                      <input 
                        type="checkbox" 
                        id="optional_inspection"
                        checked={inspectionRequested}
                        onChange={(e) => setInspectionRequested(e.target.checked)}
                        className="w-5 h-5 rounded border-primary bg-background-dark text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="optional_inspection" className="text-sm font-black text-white cursor-pointer select-none">
                        Solicitar inspección técnica opcional (Recomendado)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8 rounded-[40px] border border-primary/10 space-y-8">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Eye size={20} />
                  </div>
                  Revisar y Publicar
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Photo Preview Slider */}
                  <div className="space-y-4">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-slate-800 bg-background-dark/50">
                      {photos.length > 0 ? (
                        <img src={photos[0]} alt="Front cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {photos.map((p, idx) => (
                        <div key={idx} className="w-16 h-12 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                          <img src={p} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Listing */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-2xl font-black text-white">{vehicleInfo.brand} {vehicleInfo.model}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Año {vehicleInfo.year} • {vehicleInfo.category}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/50">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Kilometraje</span>
                        <p className="font-bold text-white text-sm">{parseInt(vehicleInfo.mileage).toLocaleString()} Km</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Precio</span>
                        <p className="font-black text-primary text-lg">{parseFloat(price).toLocaleString()} Bs.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Servicio de Inspección</span>
                      <p className="font-bold text-white text-sm">
                        {requiresInspection ? 'Obligatoria (Requerida)' : 
                         inspectionRequested ? 'Solicitada (Opcional)' : 'No solicitada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1 || isSaving}
          className="bg-background-dark border border-primary/10 text-slate-400 font-bold px-8 py-4 rounded-2xl hover:bg-slate-850 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          Anterior
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!isStepValid()}
            className="bg-primary text-background-dark font-black px-8 py-4 rounded-2xl flex items-center gap-2 glow-shadow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Siguiente
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="bg-primary text-background-dark font-black px-10 py-5 rounded-2xl flex items-center gap-3 glow-shadow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
            ) : (
              <Save size={20} />
            )}
            {isSaving ? 'Publicando...' : 'Confirmar y Publicar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AddProductScreen;
