-- =============================================================
-- KΛIZEN CΛPS — Schema para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

CREATE TABLE IF NOT EXISTS public.kaizen_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_id TEXT DEFAULT 'kaizen-caps',
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(8,2) NOT NULL,
  categoria TEXT DEFAULT 'Hype',
  imagen_url TEXT,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kaizen_disponible
  ON public.kaizen_productos (disponible, created_at DESC);

ALTER TABLE public.kaizen_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kaizen_public_select" ON public.kaizen_productos;
CREATE POLICY "kaizen_public_select" ON public.kaizen_productos
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "kaizen_auth_insert" ON public.kaizen_productos;
CREATE POLICY "kaizen_auth_insert" ON public.kaizen_productos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kaizen_auth_update" ON public.kaizen_productos;
CREATE POLICY "kaizen_auth_update" ON public.kaizen_productos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kaizen_auth_delete" ON public.kaizen_productos;
CREATE POLICY "kaizen_auth_delete" ON public.kaizen_productos
  FOR DELETE TO authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "imagenes_public_select" ON storage.objects;
CREATE POLICY "imagenes_public_select" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'imagenes');

DROP POLICY IF EXISTS "imagenes_auth_insert" ON storage.objects;
CREATE POLICY "imagenes_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imagenes');

DROP POLICY IF EXISTS "imagenes_auth_update" ON storage.objects;
CREATE POLICY "imagenes_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'imagenes') WITH CHECK (bucket_id = 'imagenes');

DROP POLICY IF EXISTS "imagenes_auth_delete" ON storage.objects;
CREATE POLICY "imagenes_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'imagenes');
