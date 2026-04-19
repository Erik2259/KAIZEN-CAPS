'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

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
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(translateError(error.message));
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <main className="bg-glow min-h-dvh flex items-center justify-center px-5">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="glass w-full max-w-sm rounded-3xl p-6 md:p-8"
      >
        <div className="text-center mb-6">
          <div className="brand-mark tracking-widest text-xs text-fg-muted">KΛIZEN CΛPS</div>
          <h1 className="brand-mark text-2xl md:text-3xl mt-1">Panel Admin</h1>
        </div>

        <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1">Email</label>
        <div className="relative mb-4">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-bg rounded-xl border border-bg-border text-sm outline-none focus:border-electric transition-colors"
            placeholder="tu@correo.com"
          />
        </div>

        <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1">Contraseña</label>
        <div className="relative mb-5">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-bg rounded-xl border border-bg-border text-sm outline-none focus:border-electric transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-electric text-white font-semibold tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
        </button>

        <div className="mt-5 pt-4 border-t border-bg-border">
          <p className="text-[10px] text-fg-muted text-center leading-relaxed">
            ¿Primera vez? Crea tu usuario admin en<br />
            <span className="text-electric">Supabase → Authentication → Users → Add user</span>
          </p>
        </div>
      </motion.form>
    </main>
  );
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed'))
    return 'Email sin confirmar. Ve a Supabase → Authentication → Providers → Email y desactiva "Confirm email".';
  if (m.includes('supabaseurl') || m.includes('supabasekey') || m.includes('faltan'))
    return 'Variables de entorno faltan en Vercel. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.';
  if (m.includes('fetch')) return 'No se pudo conectar con Supabase. Revisa tu URL.';
  return msg;
}
