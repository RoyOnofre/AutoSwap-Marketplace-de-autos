import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { toast } from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, listingId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecciona una calificación');
      return;
    }
    try {
      await api.submitRating(listingId, rating, comment);
      toast.success('¡Gracias por tu calificación!');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar la calificación');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-gray-900/80 rounded-2xl p-6 shadow-xl backdrop-blur-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-black text-white mb-4 text-center">
          Califica tu compra
        </h2>
        <div className="flex justify-center mb-4">
          {[...Array(5)].map((_, idx) => {
            const starIdx = idx + 1;
            return (
              <button
                key={starIdx}
                type="button"
                onClick={() => setRating(starIdx)}
                onMouseEnter={() => setHover(starIdx)}
                onMouseLeave={() => setHover(0)}
                className="focus:outline-none"
              >
                <Star
                  size={32}
                  className={
                    starIdx <= (hover || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-500'
                  }
                />
              </button>
            );
          })}
        </div>
        <textarea
          placeholder="Déjanos un comentario (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full h-24 p-3 rounded-lg bg-background-dark text-white placeholder:text-slate-500 border border-primary/20 focus:outline-none focus:border-primary transition"
        />
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-primary text-background-dark hover:bg-primary/80 transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};
