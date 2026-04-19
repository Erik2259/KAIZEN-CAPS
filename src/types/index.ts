export interface Producto {
  id: string;
  niche_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  imagen_url: string | null;
  disponible: boolean;
  created_at: string;
}
