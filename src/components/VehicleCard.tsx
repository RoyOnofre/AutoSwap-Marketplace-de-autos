import React, { useState } from 'react';
import { api } from '../api';
import { toast } from 'react-hot-toast';
import PaymentSelector from './PaymentSelector';

interface Props {
  vehicle: any; // TODO: replace with proper Vehicle type
  userRole: string;
}

const VehicleCard: React.FC<Props> = ({ vehicle, userRole }) => {
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBuyClick = () => {
    setShowSelector(true);
  };

  const handleSelectMethod = async (method: string) => {
    setLoading(true);
    try {
      await api.comprarVehiculo(vehicle.id, method);
      toast.success('Compra exitosa con método: ' + method);
    } catch (e: any) {
      toast.error(e?.message || 'Error al procesar pago');
    } finally {
      setLoading(false);
      setShowSelector(false);
    }
  };

  const handleCancel = () => {
    setShowSelector(false);
  };

  return (
    <div className="bg-surface-dark rounded-[24px] p-6 shadow-lg">
      <h3 className="text-xl font-bold text-white mb-1">
        {vehicle.marca ? vehicle.marca : 'Marca'} {vehicle.modelo}
      </h3>
      <p className="text-white mb-2">Precio: {vehicle.precio_clp} CLP</p>
      {userRole === 'comprador' && vehicle.estado_validacion === 'aprobado' && (
        <button
          onClick={handleBuyClick}
          className="mt-4 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Iniciar Compra Seguro'}
        </button>
      )}
      {showSelector && (
        <PaymentSelector onSelect={handleSelectMethod} onCancel={handleCancel} />
      )}
    </div>
  );
};

export default VehicleCard;
