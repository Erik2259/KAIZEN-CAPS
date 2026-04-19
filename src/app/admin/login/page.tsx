'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Desactiva "Confirm email" en Supabase → Authentication → Providers → Email.';
  if (m.includes('faltan') || m.includes('supabase')) return 'Variables de entorno faltantes en Vercel (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).';
  return msg;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { setError(translateError(error.message)); setLoading(false); return; }
      router.push('/admin');
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? translateError(e.message) : 'Error desconocido');
      setLoading(false);
    }
  };

  return (
    <main className="bg-glow min-h-dvh flex items-center justify-center px-5">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="glass w-full max-w-sm rounded-3xl p-7"
      >
        <div className="text-center mb-7">
          <p className="brand-mark text-[10px] tracking-widest text-fg-muted">KΛIZEN CΛPS</p>
          <h1 className="brand-mark text-2xl mt-1">Centro de Control</h1>
        </div>

        <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1">Email</label>
        <div className="relative mb-4">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-bg rounded-xl border border-bg-border text-sm outline-none focus:border-electric transition-colors" placeholder="tu@correo.com" />
        </div>

        <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1">Contraseña</label>
        <div className="relative mb-5">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-bg rounded-xl border border-bg-border text-sm outline-none focus:border-electric transition-colors" placeholder="••••••••" />
        </div>

        {error && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-electric text-white font-semibold tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
        </button>

        <p className="mt-5 text-[10px] text-fg-muted text-center leading-relaxed border-t border-bg-border pt-4">
          Usuario admin en: <span className="text-electric">Supabase → Authentication → Users → Add user</span>
        </p>
      </motion.form>
    </main>
  );
}
