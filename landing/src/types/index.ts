export interface VehicleListing {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje_km: number;
  precio_bs: number;
  imagen: string;
  estado_validacion: 'aprobado' | 'pendiente' | 'rechazado' | 'vendido';
  tipo_combustible: string;
  transmision: string;
  ciudad: string;
  garantia_escrow: boolean;
}
