export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export type UserRole = 'admin' | 'vendedor' | 'comprador' | 'inspector';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Activo' | 'Inactivo' | 'Pendiente';
  kyc_estado?: 'Pendiente' | 'Aprobado' | 'Rechazado';
  lastLogin: string;
  initials: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface Movement {
  id: string;
  date: string;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  quantity: number;
  user: string;
  reason: string;
}

export type Screen = 
  | 'login' 
  | 'register' 
  | 'dashboard' 
  | 'inventory' 
  | 'product-detail' 
  | 'add-product' 
  | 'pos' 
  | 'reports'
  | 'profile'
  | 'sales-history'
  | 'settings'
  | 'user-management'
  | 'inspector';

export interface Sale {
  id: string;
  date: string;
  customer: string;
  total: number;
  items: number;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  status: 'Completada' | 'Cancelada' | 'Reembolsada';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
}
