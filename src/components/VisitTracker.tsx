'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function VisitTracker() {
  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      if (sessionStorage.getItem('kz_v')) return;

      const sessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      sessionStorage.setItem('kz_v', '1');

      const sb = createClient();
      sb.from('kaizen_visitas').insert({ session_id: sessionId }).then(() => {});
    } catch {
      /* silent — no rompe la app si falla */
    }
  }, []);

  return null;
}
