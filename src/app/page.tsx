'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Flame, Instagram } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { KaizenLogo } from '@/components/KaizenLogo';
import { Gateway } from '@/components/Gateway';
import { ProductModal } from '@/components/ProductModal';
import type { Producto } from '@/types';

const CATEGORIAS_FILTER = ['Todos', 'KΛIZEN Essentials', 'Hype Selection', 'The Vault'] as const;

export default function BoutiquePage() {
  const [entered, setEntered] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtered, setFiltered] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Producto | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('Todos');

  useEffect(() => {
    const load = async () => {
      try {
        const sb = createClient();
        const { data, error } = await sb
          .from('kaizen_productos')
          .select('*')
          .gt('stock', 0)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProductos((data ?? []) as Producto[]);
        setFiltered((data ?? []) as Producto[]);
      } catch (e) { console.error('[kaizen]', e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    setFiltered(
      activeFilter === 'Todos'
        ? productos
        : productos.filter(p => p.categoria === activeFilter)
    );
  }, [activeFilter, productos]);

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  return (
    <>
      <AnimatePresence>
        {!entered && <Gateway onEnter={() => setEntered(true)} />}
      </AnimatePresence>

      <main className="bg-glow min-h-dvh">
        {/* NAV */}
        <nav className="sticky top-0 z-40 px-5 md:px-10 py-3 backdrop-blur-xl bg-bg/70 border-b border-bg-border/40">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <KaizenLogo variant="horizontal" size={30} />
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/kaizencaps"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram KΛIZEN"
                className="text-fg-muted hover:text-electric transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-1.5 text-[10px] text-fg-muted tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse-glow" />
                DROP 01
              </div>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="px-5 md:px-10 pt-10 md:pt-20 pb-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="md:grid md:grid-cols-2 md:gap-16 md:items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bg-border text-[10px] tracking-widest text-fg-muted uppercase mb-6">
                <Flame className="w-3 h-3 text-electric" />
                Edición limitada · Curado a mano
              </div>
              <h1 className="brand-mark text-5xl md:text-7xl leading-[0.92] tracking-tight text-electric-gradient">
                Cada gorra<br />
                <span className="text-electric">define</span><br />
                un status.
              </h1>
              <p className="mt-5 text-sm md:text-base text-fg-muted leading-relaxed max-w-md">
                Drop por drop. Solo las piezas más hype, seleccionadas para quienes entienden el juego.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#drop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-electric text-white text-sm font-semibold tracking-wide transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(0,71,255,.5)]"
                >
                  <Flame className="w-4 h-4" />
                  Ver el Drop
                </a>
                <span className="text-xs text-fg-muted">{productos.length} piezas</span>
              </div>
            </div>

            {/* Desktop hero — Banner ancho con neon LED azul */}
            <div className="hidden md:flex items-center justify-center">
              <div
                className="relative w-full max-w-[560px] rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: '16/7',
                  boxShadow: `
                    0 0 0 1px rgba(0,71,255,0.5),
                    0 0 12px 2px rgba(0,71,255,0.4),
                    0 0 30px 6px rgba(0,71,255,0.25),
                    0 0 60px 12px rgba(0,71,255,0.12),
                    inset 0 0 30px rgba(0,71,255,0.05)
                  `,
                }}
              >
                <Image
                  src="/assets/banner_vault.png"
                  alt="KΛIZEN CΛPS"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/40 via-transparent to-[#0A0A0C]/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/30 via-transparent to-[#0A0A0C]/30 pointer-events-none" />
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    border: '1px solid rgba(0,71,255,0.6)',
                    animation: 'neon-border 3s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* FILTROS */}
        <section className="px-5 md:px-10 max-w-6xl mx-auto mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIAS_FILTER.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs tracking-wider border transition-all ${
                  activeFilter === cat
                    ? 'bg-electric border-electric text-white shadow-[0_0_20px_rgba(0,71,255,.4)]'
                    : 'border-bg-border text-fg-muted hover:border-electric/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* GRID */}
        <section id="drop" className="px-5 md:px-10 pb-32 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="brand-mark text-base md:text-xl tracking-widest">CATÁLOGO</h2>
            <span className="text-[10px] tracking-widest text-fg-muted uppercase">
              {filtered.length} pieza{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-bg-card/60 border border-bg-border animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Flame className="w-8 h-8 text-electric mx-auto mb-3" />
              <p className="brand-mark tracking-widest text-sm">SIN PIEZAS EN ESTA CATEGORÍA</p>
              <p className="mt-2 text-xs text-fg-muted">Próximo drop pronto.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} p={p} onTap={() => setSelected(p)} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-bg-border/40 px-5 md:px-10 py-8 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <KaizenLogo variant="horizontal" size={24} className="opacity-50" />
            <div className="flex items-center gap-4 text-fg-muted">
              <a
                href="https://instagram.com/kaizencaps"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs hover:text-electric transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                @kaizencaps
              </a>
              <span className="text-[10px] opacity-40">© {new Date().getFullYear()} KΛIZEN CΛPS</span>
            </div>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {selected && <ProductModal p={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}

/* ── PRODUCT CARD ────────────────────────────────────────── */
function ProductCard({ p, onTap, index }: { p: Producto; onTap: () => void; index: number }) {
  const allImgs = [
    ...(p.imagenes?.length ? p.imagenes : []),
    ...(p.imagen_url && !p.imagenes?.includes(p.imagen_url) ? [p.imagen_url] : []),
  ].filter(Boolean) as string[];

  const imgs = allImgs.length > 0 ? allImgs : (p.imagen_url ? [p.imagen_url] : []);
  const [imgIndex, setImgIndex] = useState(0);
  const totalImgs = imgs.length;
  const precioMostrar = p.en_promocion && p.precio_oferta ? p.precio_oferta : p.precio;

  // Auto-rotate cada 2.5 segundos
  useEffect(() => {
    if (totalImgs <= 1) return;
    const t = setInterval(() => {
      setImgIndex(i => (i + 1) % totalImgs);
    }, 2500);
    return () => clearInterval(t);
  }, [totalImgs]);

  const currentImg = imgs[imgIndex] ?? null;

  return (
    <motion.button
      layoutId={`card-${p.id}`}
      onClick={onTap}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileTap={{ scale: 0.97 }}
      className="glass glass-hover relative aspect-[3/4] rounded-2xl overflow-hidden text-left w-full"
    >
      {/* Imagen con crossfade automático */}
      <motion.div layoutId={`img-${p.id}`} className="absolute inset-0">
        {currentImg ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={imgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full p-4"
            >
              <Image
                src={currentImg}
                alt={p.nombre}
                fill
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                className="object-contain drop-shadow-[0_10px_25px_rgba(0,71,255,.3)]"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-fg-muted text-[10px]">
            Sin imagen
          </div>
        )}
      </motion.div>

      {/* Badge categoría */}
      <motion.span
        layoutId={`cat-${p.id}`}
        className="absolute top-3 left-3 text-[8px] tracking-widest uppercase text-fg-muted px-2 py-0.5 rounded-full border border-bg-border bg-bg/80 z-10"
      >
        {p.categoria}
      </motion.span>

      {/* Dots indicadores — solo si hay más de 1 imagen */}
      {totalImgs > 1 && (
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          {imgs.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === imgIndex ? 'w-4 bg-electric' : 'w-1 bg-bg-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Badge promo */}
      {p.en_promocion && (
        <span className="absolute top-10 left-3 text-[8px] tracking-widest uppercase text-electric px-2 py-0.5 rounded-full border border-electric/40 bg-electric/10 z-10">
          PROMO
        </span>
      )}

      {/* Urgencia de stock */}
      {p.stock > 0 && p.stock < 3 && (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-14 left-2 right-2 text-center text-[9px] text-red-300 bg-red-900/40 border border-red-500/30 rounded-full px-2 py-1 z-10"
        >
          🔥 Solo quedan {p.stock} piezas en la bóveda
        </motion.div>
      )}

      {/* Info */}
      <motion.div
        layoutId={`info-${p.id}`}
        className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-bg via-bg/95 to-transparent z-10"
      >
        <motion.h3
          layoutId={`name-${p.id}`}
          className="brand-mark text-[12px] md:text-sm text-fg leading-tight line-clamp-1"
        >
          {p.nombre}
        </motion.h3>
        <motion.div layoutId={`price-${p.id}`} className="mt-1 flex items-baseline gap-2">
          <span className="text-electric text-sm font-bold">${precioMostrar.toFixed(0)}</span>
          {p.en_promocion && p.precio_oferta && (
            <span className="text-fg-muted text-[10px] line-through">${p.precio.toFixed(0)}</span>
          )}
          <span className="text-[10px] text-fg-muted font-normal">MXN</span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
