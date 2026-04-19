export interface Producto {
  id: string;
  niche_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  imagen_url: string | null;   // legacy compat
  imagenes: string[] | null;   // array para carrusel
  disponible: boolean;
  created_at: string;
}
