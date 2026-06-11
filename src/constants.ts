// src/constants.ts
// Mock notifications and sales data for development/testing
export const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Bienvenido',
    message: '¡Comienza a explorar la tienda de autos!',
    type: 'info',
    time: 'Ahora',
    read: false,
  },
  {
    id: '2',
    title: 'Nueva publicación',
    message: 'Tu vehículo ha sido publicado exitosamente.',
    type: 'success',
    time: 'Hace 5 min',
    read: false,
  },
];

// Mock sales data used in SalesHistoryScreen when no API data is available
export const MOCK_SALES = [
  {
    id: 'sale-1',
    date: '2024-01-15',
    customer: 'Juan Pérez',
    total: 15000,
    paymentMethod: 'Transferencia',
  },
  {
    id: 'sale-2',
    date: '2024-02-20',
    customer: 'María Gómez',
    total: 22000,
    paymentMethod: 'Efectivo',
  },
  {
    id: 'sale-3',
    date: '2024-03-05',
    customer: 'Carlos Ruiz',
    total: 18000,
    paymentMethod: 'Tarjeta',
  },
];
