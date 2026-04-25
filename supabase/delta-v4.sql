-- ================================================================
-- KΛIZEN CΛPS — Delta v4
-- SOLO ejecutar esto (no el schema completo)
-- Supabase → SQL Editor → New Query → Run
-- ================================================================

-- 1) Migrar disponible → stock
ALTER TABLE public.kaizen_productos
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;

UPDATE public.kaizen_productos
  SET stock = CASE WHEN disponible THEN 1 ELSE 0 END
  WHERE stock = 1 AND disponible IS NOT NULL;

ALTER TABLE public.kaizen_productos
  DROP COLUMN IF EXISTS disponible;

-- 2) Tabla ventas
CREATE TABLE IF NOT EXISTS public.kaizen_ventas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES public.kaizen_productos(id) ON DELETE SET NULL,
  nombre      TEXT NOT NULL,
  precio      NUMERIC(8,2) NOT NULL,
  categoria   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kaizen_ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ventas_auth_all" ON public.kaizen_ventas;
CREATE POLICY "ventas_auth_all" ON public.kaizen_ventas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ventas_public_select" ON public.kaizen_ventas;
CREATE POLICY "ventas_public_select" ON public.kaizen_ventas
  FOR SELECT TO anon USING (false);

-- 3) Tabla visitas
CREATE TABLE IF NOT EXISTS public.kaizen_visitas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kaizen_visitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitas_anon_insert" ON public.kaizen_visitas;
CREATE POLICY "visitas_anon_insert" ON public.kaizen_visitas
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "visitas_auth_select" ON public.kaizen_visitas;
CREATE POLICY "visitas_auth_select" ON public.kaizen_visitas
  FOR SELECT TO authenticated USING (true);

-- ================================================================
-- LISTO. El frontend ya usa stock > 0 en lugar de disponible = true
-- ================================================================
