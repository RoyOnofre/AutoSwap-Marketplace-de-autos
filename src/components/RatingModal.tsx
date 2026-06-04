import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { toast } from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendedorId: string;
  onSuccess?: (nuevoPromedio: number) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, vendedorId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecciona una calificación en estrellas');
      return;
    }
    setLoading(true);
    try {
      const res = await api.calificarVendedor(vendedorId, rating, comment);
      toast.success('¡Gracias por calificar al vendedor!');
      if (onSuccess && res.promedio !== undefined) {
        onSuccess(res.promedio);
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar la calificación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19]/90 backdrop-blur-md px-4">
      <div className="w-full max-w-md bg-[#151b26] border border-primary/20 rounded-[32px] p-6 shadow-2xl backdrop-blur-xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
        >
          <X size={20} />
        </button>
        
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Calificar Vendedor
          </h2>
          <p className="text-xs text-slate-400">
            Comparte tu experiencia para ayudar a otros miembros de la comunidad AutoSwap.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {[...Array(5)].map((_, idx) => {
            const starIdx = idx + 1;
            return (
              <button
                key={starIdx}
                type="button"
                onClick={() => setRating(starIdx)}
                onMouseEnter={() => setHover(starIdx)}
                onMouseLeave={() => setHover(0)}
                disabled={loading}
                className="focus:outline-none transition-transform active:scale-90 duration-100"
              >
                <Star
                  size={38}
                  className={`transition-colors duration-200 ${
                    starIdx <= (hover || rating)
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                      : 'text-slate-650 hover:text-slate-500'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              placeholder="Déjanos un comentario acerca de tu experiencia (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              className="w-full h-28 p-4 rounded-2xl bg-background-dark/50 text-white placeholder:text-slate-500 border border-primary/10 focus:outline-none focus:border-primary/50 transition-all text-xs resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-background-dark border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-primary text-background-dark font-black hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95 text-xs shadow-lg shadow-primary/10"
            >
              {loading ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
