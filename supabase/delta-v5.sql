-- ================================================================
-- KΛIZEN CΛPS — Delta v5 (solo ejecutar esto)
-- Supabase → SQL Editor → New Query → Run
-- ================================================================

ALTER TABLE public.kaizen_productos
  ADD COLUMN IF NOT EXISTS en_promocion  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_oferta NUMERIC(8,2);
