import React from 'react';
import { formatCurrency } from '@/lib/formatters';

interface CheckoutSummaryProps {
  transaction: {
    id: string;
    price: number;
    seller_id: string;
    buyer_id: string;
    created_at: string;
  };
}

export default function CheckoutSummary({ transaction }: CheckoutSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Resumen de la Compra
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
        <div>ID</div>
        <div>{transaction.id}</div>
        <div>Vendedor</div>
        <div>{transaction.seller_id}</div>
        <div>Comprador</div>
        <div>{transaction.buyer_id}</div>
        <div>Fecha</div>
        <div>{new Date(transaction.created_at).toLocaleDateString('es-BO')}</div>
        <div className="col-span-2 text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
          {formatCurrency(transaction.price)}
        </div>
      </div>
    </div>
  );
}
