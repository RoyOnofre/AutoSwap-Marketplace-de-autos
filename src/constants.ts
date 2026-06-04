import { Product, User, Movement, Sale, Notification } from './types';



export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Alejandro Moreno',
    email: 'alejandro@techstore.com',
    role: 'admin',
    status: 'Activo',
    lastLogin: 'Hace 5 min',
    initials: 'AM',
    phone: '+52 55 1234 5678',
    address: 'Av. Insurgentes Sur 123, CDMX'
  },
  {
    id: '2',
    name: 'Sofia Castro',
    email: 'sofia.c@techstore.com',
    role: 'vendedor',
    status: 'Activo',
    lastLogin: 'Hace 2 horas',
    initials: 'SC',
    phone: '+52 55 8765 4321'
  },
  {
    id: '3',
    name: 'Ricardo Sosa',
    email: 'rsosa@techstore.com',
    role: 'admin',
    status: 'Inactivo',
    lastLogin: 'Ayer',
    initials: 'RS'
  },
  {
    id: '4',
    name: 'Elena Ruiz',
    email: 'eruiz@techstore.com',
    role: 'comprador',
    status: 'Pendiente',
    lastLogin: 'Nunca',
    initials: 'ER'
  }
];

export const MOCK_SALES: Sale[] = [
  {
    id: 'V-1001',
    date: '12 Mar 2026, 14:30',
    customer: 'Juan Pérez',
    total: 2499.00,
    items: 1,
    paymentMethod: 'Tarjeta',
    status: 'Completada'
  },
  {
    id: 'V-1002',
    date: '12 Mar 2026, 15:15',
    customer: 'Maria Garcia',
    total: 1598.00,
    items: 2,
    paymentMethod: 'Efectivo',
    status: 'Completada'
  },
  {
    id: 'V-1003',
    date: '11 Mar 2026, 10:20',
    customer: 'Carlos Slim',
    total: 12999.00,
    items: 5,
    paymentMethod: 'Transferencia',
    status: 'Completada'
  },
  {
    id: 'V-1004',
    date: '11 Mar 2026, 16:45',
    customer: 'Ana Lopez',
    total: 399.00,
    items: 1,
    paymentMethod: 'Tarjeta',
    status: 'Cancelada'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Stock Bajo',
    message: 'El producto iPhone 15 Pro tiene solo 5 unidades restantes.',
    time: 'Hace 5 min',
    type: 'warning',
    read: false
  },
  {
    id: '2',
    title: 'Venta Exitosa',
    message: 'Se ha procesado una venta por $2,499.00.',
    time: 'Hace 15 min',
    type: 'success',
    read: false
  },
  {
    id: '3',
    title: 'Error de Sistema',
    message: 'Fallo en la sincronización con el servidor de pagos.',
    time: 'Hace 1 hora',
    type: 'error',
    read: true
  },
  {
    id: '4',
    title: 'Nuevo Usuario',
    message: 'Elena Ruiz se ha registrado en el sistema.',
    time: 'Hace 3 horas',
    type: 'info',
    read: true
  }
];

export const MOCK_MOVEMENTS: Movement[] = [
  {
    id: '1',
    date: '20 Oct 2023, 14:30',
    type: 'ENTRADA',
    quantity: 10,
    user: 'Carlos Ruiz',
    reason: 'Reabastecimiento Proveedor HP'
  },
  {
    id: '2',
    date: '19 Oct 2023, 11:20',
    type: 'SALIDA',
    quantity: 2,
    user: 'Sistema (Auto)',
    reason: 'Venta Online #ORD-8921'
  },
  {
    id: '3',
    date: '18 Oct 2023, 16:45',
    type: 'AJUSTE',
    quantity: 1,
    user: 'Admin Jefe',
    reason: 'Producto Dañado en Almacén'
  }
];
