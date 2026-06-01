import React from 'react';

type PaymentMethod = 'QR' | 'EFECTIVO' | 'BANCA_MOVIL' | 'DOLARES';

interface PaymentSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  onCancel: () => void;
}

/**
 * Selector de método de pago – tarjetas grandes y seleccionables.
 * Cada button tiene su propio color y estilo para destacar.
 */
const PaymentSelector: React.FC<PaymentSelectorProps> = ({ onSelect, onCancel }) => {
  const methods: { label: string; value: PaymentMethod; color: string }[] = [
    { label: 'QR', value: 'QR', color: 'bg-purple-600' },
    { label: 'Efectivo', value: 'EFECTIVO', color: 'bg-green-600' },
    { label: 'Banca Móvil', value: 'BANCA_MOVIL', color: 'bg-blue-600' },
    { label: 'Dólares', value: 'DOLARES', color: 'bg-yellow-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-dark rounded-[24px] p-8 w-96 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          Selecciona método de pago
        </h2>
        <div className="grid gap-4">
          {methods.map((m) => (
            <button
              key={m.value}
              className={`${m.color} text-white py-3 rounded-[16px] hover:opacity-90 transition`}
              onClick={() => onSelect(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          className="mt-6 w-full py-2 text-sm text-gray-300 hover:text-white"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PaymentSelector;
