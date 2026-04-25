export interface Producto {
  id: string;
  niche_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_oferta: number | null;
  en_promocion: boolean;
  categoria: string;
  imagen_url: string | null;
  imagenes: string[] | null;
  stock: number;
  created_at: string;
}

export interface Venta {
  id: string;
  producto_id: string | null;
  nombre: string;
  precio: number;
  categoria: string | null;
  created_at: string;
}

export interface Visita {
  id: string;
  session_id: string | null;
  created_at: string;
}

export interface AnalyticsData {
  totalGanancias: number;
  totalStock: number;
  visitas: number;
  ventas: Venta[];
}
