'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X, Flame, Sparkles, Instagram } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Producto } from '@/types';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
const BRAND = 'KΛIZEN CΛPS';

function buildWhatsAppLink(p: Producto): string {
  const lines = [
    `Hola KΛIZEN 👋`,
    ``,
    `Quiero pedir esta gorra:`,
    `• *${p.nombre}*`,
    `• Categoría: ${p.categoria}`,
    `• Precio: $${p.precio.toFixed(2)} MXN`,
    ``,
    `¿Sigue disponible? 🧢`,
  ];
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export default function BoutiquePage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Producto | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('kaizen_productos')
          .select('*')
          .eq('disponible', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProductos((data ?? []) as Producto[]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error cargando';
        setErr(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  return (
    <main className="bg-glow min-h-dvh relative">
      {/* NAV */}
      <nav className="sticky top-0 z-40 px-5 md:px-8 py-4 backdrop-blur-lg bg-bg/60 border-b border-bg-border/40">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <span className="brand-mark text-[13px] md:text-[15px] tracking-widest text-fg">{BRAND}</span>
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-fg-muted tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse-glow" />
            DROP 01 · LIVE
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-5 md:px-8 pt-10 md:pt-20 pb-8 md:pb-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="md:grid md:grid-cols-2 md:gap-12 md:items-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bg-border text-[10px] tracking-widest text-fg-muted uppercase mb-6">
              <Sparkles className="w-3 h-3 text-electric" />
              Edición limitada · Calidad G5
            </div>

            <h1 className="brand-mark text-5xl md:text-7xl leading-[0.95] tracking-tight text-electric-gradient">
              Cada gorra<br />
              <span className="text-electric">define</span><br />
              un status.
            </h1>

            <p className="mt-5 md:mt-7 text-sm md:text-base text-fg-muted leading-relaxed max-w-md">
              Pieza por pieza. Drop por drop. Solo las más hype, curadas para los que entienden el juego.
            </p>

            <div className="mt-8 flex items-center gap-3 md:gap-4">
              <a
                href="#drop"
                className="inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-full bg-electric text-white text-sm font-semibold tracking-wide transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(0,71,255,0.5)]"
              >
                <Flame className="w-4 h-4" />
                Ver el Drop
              </a>
              <span className="text-xs text-fg-muted">{productos.length} piezas disponibles</span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-[420px] h-[420px] glass rounded-[32px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric/20 via-transparent to-transparent" />
              <div className="brand-mark text-[120px] text-electric/30 select-none">Λ</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* GRID */}
      <section id="drop" className="px-5 md:px-8 pb-32 max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-5 md:mb-8">
          <h2 className="brand-mark text-lg md:text-2xl tracking-widest">CATÁLOGO</h2>
          <span className="text-[10px] md:text-xs tracking-widest text-fg-muted uppercase">Tap para ver</span>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : err ? (
          <ErrorState msg={err} />
        ) : productos.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {productos.map((p, i) => (
              <ProductCard key={p.id} producto={p} onTap={() => setSelected(p)} index={i} />
            ))}
          </motion.div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-bg-border/40 px-5 md:px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <span className="brand-mark text-xs tracking-widest text-fg-muted">
            © {new Date().getFullYear()} {BRAND}
          </span>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-fg-muted hover:text-electric transition-colors"
          >
            <Instagram className="w-4 h-4" />
          </a>
        </div>
      </footer>

      <AnimatePresence>
        {selected && <ProductDetail producto={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </main>
  );
}

function ProductCard({ producto, onTap, index }: { producto: Producto; onTap: () => void; index: number }) {
  return (
    <motion.button
      layoutId={`card-${producto.id}`}
      onClick={onTap}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileTap={{ scale: 0.97 }}
      className="glass glass-hover relative aspect-[3/4] rounded-2xl overflow-hidden text-left group"
    >
      <motion.div
        layoutId={`img-wrap-${producto.id}`}
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        {producto.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img
            layoutId={`img-${producto.id}`}
            src={producto.imagen_url}
            alt={producto.nombre}
            className="max-w-full max-h-full object-contain drop-shadow-[0_10px_25px_rgba(0,71,255,0.25)] animate-float"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-bg-border/40 flex items-center justify-center text-fg-muted text-xs">
            Sin imagen
          </div>
        )}
      </motion.div>

      <motion.span
        layoutId={`cat-${producto.id}`}
        className="absolute top-3 left-3 text-[9px] tracking-widest uppercase text-fg-muted px-2 py-0.5 rounded-full border border-bg-border bg-bg/80"
      >
        {producto.categoria}
      </motion.span>

      <motion.div
        layoutId={`info-${producto.id}`}
        className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-bg via-bg/90 to-transparent"
      >
        <motion.h3
          layoutId={`name-${producto.id}`}
          className="brand-mark text-[13px] md:text-sm tracking-wide text-fg leading-tight line-clamp-1"
        >
          {producto.nombre}
        </motion.h3>
        <motion.p layoutId={`price-${producto.id}`} className="mt-1 text-electric text-sm md:text-base font-bold">
          ${producto.precio.toFixed(0)}
          <span className="text-[10px] text-fg-muted ml-1 font-normal">MXN</span>
        </motion.p>
      </motion.div>
    </motion.button>
  );
}

function ProductDetail({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ backgroundColor: 'rgba(10,10,12,0)' }}
      animate={{ backgroundColor: 'rgba(10,10,12,0.85)' }}
      exit={{ backgroundColor: 'rgba(10,10,12,0)' }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${producto.id}`}
        onClick={(e) => e.stopPropagation()}
        className="glass relative w-full sm:max-w-2xl h-[90dvh] sm:h-auto sm:max-h-[90dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col sm:grid sm:grid-cols-2"
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-bg/80 backdrop-blur border border-bg-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-bg-border" />
        </div>

        <motion.div
          layoutId={`img-wrap-${producto.id}`}
          className="relative flex-shrink-0 h-[45dvh] sm:h-full flex items-center justify-center p-8 bg-gradient-to-b sm:bg-gradient-to-r from-electric/5 to-transparent"
        >
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              layoutId={`img-${producto.id}`}
              src={producto.imagen_url}
              alt={producto.nombre}
              className="max-w-full max-h-full object-contain drop-shadow-[0_20px_40px_rgba(0,71,255,0.4)] animate-float"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-bg-border/40" />
          )}
        </motion.div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
            <motion.span
              layoutId={`cat-${producto.id}`}
              className="text-[9px] tracking-widest uppercase text-fg-muted px-2 py-0.5 rounded-full border border-bg-border bg-bg/80"
            >
              {producto.categoria}
            </motion.span>

            <motion.div layoutId={`info-${producto.id}`} className="mt-4">
              <motion.h2 layoutId={`name-${producto.id}`} className="brand-mark text-2xl md:text-3xl tracking-wide">
                {producto.nombre}
              </motion.h2>
              <motion.p layoutId={`price-${producto.id}`} className="mt-2 text-electric text-3xl font-bold">
                ${producto.precio.toFixed(2)}
                <span className="text-sm text-fg-muted ml-2 font-normal">MXN</span>
              </motion.p>
            </motion.div>

            {producto.descripcion && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 text-sm text-fg-muted leading-relaxed whitespace-pre-line"
              >
                {producto.descripcion}
              </motion.p>
            )}

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 space-y-2 text-xs text-fg-muted"
            >
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-electric" />Calidad G5 — idéntica a la original</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-electric" />Stock limitado del drop</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-electric" />Envío seguro o entrega en zona</li>
            </motion.ul>
          </div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex-shrink-0 p-4 border-t border-bg-border bg-bg/80 backdrop-blur"
          >
            <a
              href={buildWhatsAppLink(producto)}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold tracking-wide active:scale-[0.98] transition-all hover:shadow-[0_0_40px_rgba(0,71,255,0.6)]"
            >
              <ShoppingBag className="w-4 h-4" />
              Pedir por WhatsApp
            </a>
            <p className="mt-2 text-center text-[10px] text-fg-muted tracking-wide">
              Checkout directo · Respuesta inmediata
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl bg-bg-card/60 border border-bg-border animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <Flame className="w-8 h-8 text-electric mx-auto mb-3" />
      <p className="brand-mark tracking-widest text-sm">DROP AGOTADO</p>
      <p className="mt-2 text-xs text-fg-muted">Próximo restock pronto. Sigue el IG.</p>
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="glass rounded-2xl p-6 text-center border-red-500/40">
      <p className="brand-mark tracking-widest text-sm text-red-400">ERROR DE CONEXIÓN</p>
      <p className="mt-2 text-xs text-fg-muted">{msg}</p>
      <p className="mt-3 text-[10px] text-fg-muted">
        Verifica variables NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en Vercel.
      </p>
    </div>
  );
}
