'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ShoppingBag, X, Flame, Instagram, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { KaizenLogo } from '@/components/KaizenLogo';
import type { Producto } from '@/types';

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

function buildWA(p: Producto) {
  const txt = encodeURIComponent(
    `Hola KΛIZEN 👋\n\nQuiero pedir:\n• *${p.nombre}*\n• $${p.precio.toFixed(2)} MXN\n\n¿Sigue disponible? 🧢`
  );
  return `https://wa.me/${WA}?text=${txt}`;
}

function getImages(p: Producto): string[] {
  if (p.imagenes && p.imagenes.length > 0) return p.imagenes;
  if (p.imagen_url) return [p.imagen_url];
  return [];
}

/* ── GATEWAY ─────────────────────────────────────────────── */
function GatewayScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      key="gateway"
      className="fixed inset-0 z-[100] bg-[#0A0A0C] flex flex-col items-center justify-center gap-12"
      exit={{ y: '-100%', transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }}
    >
      <KaizenLogo variant="stacked" size={160} pulse className="select-none" />

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={onEnter}
        className="brand-mark px-10 py-4 rounded-full border border-electric text-electric text-sm tracking-[.3em] hover:bg-electric hover:text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,71,255,.5)]"
      >
        [ ENTRΛR ]
      </motion.button>

      <p className="absolute bottom-8 text-[9px] text-fg-muted tracking-widest opacity-40">DROP 01 · LIVE</p>
    </motion.div>
  );
}

/* ── EMBLA CAROUSEL ──────────────────────────────────────── */
function ImageCarousel({ images }: { images: string[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center">
        <span className="text-fg-muted text-xs">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div ref={emblaRef} className="overflow-hidden w-full">
        <div className="flex">
          {images.map((url, i) => (
            <div key={i} className="flex-[0_0_100%] aspect-square flex items-center justify-center p-6 bg-gradient-to-b from-electric/5 to-transparent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="max-w-full max-h-full object-contain animate-float drop-shadow-[0_24px_48px_rgba(0,71,255,.45)]"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg/80 border border-bg-border flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg/80 border border-bg-border flex items-center justify-center active:scale-90 transition-transform">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex justify-center gap-1.5 pt-3 pb-1">
            {images.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)} className={`embla-dot ${i === current ? 'active' : ''}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── PRODUCT CARD ────────────────────────────────────────── */
function ProductCard({ p, onTap, index }: { p: Producto; onTap: () => void; index: number }) {
  const imgs = getImages(p);
  return (
    <motion.button
      layoutId={`card-${p.id}`}
      onClick={onTap}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileTap={{ scale: 0.96 }}
      className="glass glass-hover relative aspect-[3/4] rounded-2xl overflow-hidden text-left"
    >
      <motion.div layoutId={`img-${p.id}`} className="absolute inset-0 flex items-center justify-center p-4">
        {imgs[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgs[0]} alt={p.nombre} className="max-w-full max-h-full object-contain animate-float drop-shadow-[0_10px_25px_rgba(0,71,255,.3)]" />
        ) : (
          <div className="w-full h-full rounded-xl bg-bg-border/30 flex items-center justify-center text-fg-muted text-[10px]">Sin imagen</div>
        )}
      </motion.div>

      <motion.span layoutId={`cat-${p.id}`} className="absolute top-3 left-3 text-[9px] tracking-widest uppercase text-fg-muted px-2 py-0.5 rounded-full border border-bg-border bg-bg/80">
        {p.categoria}
      </motion.span>

      {imgs.length > 1 && (
        <span className="absolute top-3 right-3 text-[9px] tracking-widest text-fg-muted px-1.5 py-0.5 rounded-full border border-bg-border bg-bg/80">
          {imgs.length}✦
        </span>
      )}

      <motion.div layoutId={`info-${p.id}`} className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-bg via-bg/90 to-transparent">
        <motion.h3 layoutId={`name-${p.id}`} className="brand-mark text-[13px] md:text-sm text-fg leading-tight line-clamp-1">{p.nombre}</motion.h3>
        <motion.p layoutId={`price-${p.id}`} className="mt-1 text-electric text-sm font-bold">
          ${p.precio.toFixed(0)}<span className="text-[10px] text-fg-muted ml-1 font-normal">MXN</span>
        </motion.p>
      </motion.div>
    </motion.button>
  );
}

/* ── PRODUCT MODAL ───────────────────────────────────────── */
function ProductModal({ p, onClose }: { p: Producto; onClose: () => void }) {
  const imgs = getImages(p);

  const handleWA = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(50);
    window.open(buildWA(p), '_blank', 'noreferrer');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${p.id}`}
        onClick={(e) => e.stopPropagation()}
        className="glass relative w-full sm:max-w-2xl max-h-[92dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col sm:grid sm:grid-cols-2"
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <button onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-bg/80 backdrop-blur border border-bg-border flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-4 h-4" />
        </button>

        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-bg-border" />
        </div>

        <motion.div layoutId={`img-${p.id}`} className="flex-shrink-0 sm:h-full overflow-hidden">
          <ImageCarousel images={imgs} />
        </motion.div>

        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
            <motion.span layoutId={`cat-${p.id}`} className="text-[9px] tracking-widest uppercase text-fg-muted px-2 py-0.5 rounded-full border border-bg-border bg-bg/80">
              {p.categoria}
            </motion.span>
            <motion.div layoutId={`info-${p.id}`} className="mt-3">
              <motion.h2 layoutId={`name-${p.id}`} className="brand-mark text-2xl md:text-3xl">{p.nombre}</motion.h2>
              <motion.p layoutId={`price-${p.id}`} className="mt-1 text-electric text-3xl font-bold">
                ${p.precio.toFixed(2)}<span className="text-sm text-fg-muted ml-2 font-normal">MXN</span>
              </motion.p>
            </motion.div>

            {p.descripcion && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-4 text-sm text-fg-muted leading-relaxed whitespace-pre-line">
                {p.descripcion}
              </motion.p>
            )}

            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-5 space-y-1.5 text-xs text-fg-muted">
              {['Calidad G5 — idéntica a la original', 'Stock limitado del drop', 'Envío seguro o entrega en zona'].map(t => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-electric flex-shrink-0" />{t}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex-shrink-0 p-4 border-t border-bg-border bg-bg/80 backdrop-blur">
            <button
              onClick={handleWA}
              className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold tracking-wide active:scale-[0.97] transition-all hover:shadow-[0_0_40px_rgba(0,71,255,.6)]"
            >
              <ShoppingBag className="w-4 h-4" />
              PEDIR POR WHΛTSΛPP
            </button>
            <p className="mt-2 text-center text-[9px] text-fg-muted tracking-widest">CHECKOUT DIRECTO · RESPUESTA INMEDIATA</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── MAIN PAGE ───────────────────────────────────────────── */
export default function BoutiquePage() {
  const [entered, setEntered] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Producto | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const sb = createClient();
        const { data, error } = await sb
          .from('kaizen_productos')
          .select('*')
          .eq('disponible', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProductos((data ?? []) as Producto[]);
      } catch (e) {
        console.error('[kaizen]', e);
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
    <>
      <AnimatePresence>
        {!entered && <GatewayScreen onEnter={() => setEntered(true)} />}
      </AnimatePresence>

      <main className="bg-glow min-h-dvh">
        {/* NAV */}
        <nav className="sticky top-0 z-40 px-5 md:px-10 py-3 backdrop-blur-lg bg-bg/60 border-b border-bg-border/40">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <KaizenLogo variant="horizontal" size={32} />
            <div className="flex items-center gap-2 text-[10px] text-fg-muted tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse-glow" />
              DROP 01 · LIVE
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="px-5 md:px-10 pt-10 md:pt-20 pb-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="md:grid md:grid-cols-2 md:gap-16 md:items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bg-border text-[10px] tracking-widest text-fg-muted uppercase mb-6">
                <Flame className="w-3 h-3 text-electric" />
                Edición limitada · Calidad G5
              </div>
              <h1 className="brand-mark text-5xl md:text-7xl leading-[0.92] tracking-tight text-electric-gradient">
                Cada gorra<br /><span className="text-electric">define</span><br />un status.
              </h1>
              <p className="mt-5 text-sm md:text-base text-fg-muted leading-relaxed max-w-md">
                Drop por drop. Solo las más hype, curadas para los que entienden el juego.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <a href="#drop" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-electric text-white text-sm font-semibold tracking-wide transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(0,71,255,.5)]">
                  <Flame className="w-4 h-4" />Ver el Drop
                </a>
                <span className="text-xs text-fg-muted">{productos.length} disponibles</span>
              </div>
            </div>

            {/* Desktop hero — logo centrado en card glass */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-[400px] h-[400px] glass rounded-[32px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-electric/10 via-transparent to-transparent" />
                <KaizenLogo variant="stacked" size={220} pulse className="relative z-10" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* GRID */}
        <section id="drop" className="px-5 md:px-10 pb-32 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="brand-mark text-base md:text-xl tracking-widest">CATÁLOGO</h2>
            <span className="text-[10px] tracking-widest text-fg-muted uppercase">Tap para inspeccionar</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-bg-card/60 border border-bg-border animate-pulse" />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Flame className="w-8 h-8 text-electric mx-auto mb-3" />
              <p className="brand-mark tracking-widest text-sm">DROP AGOTADO</p>
              <p className="mt-2 text-xs text-fg-muted">Próximo restock pronto.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {productos.map((p, i) => (
                <ProductCard key={p.id} p={p} onTap={() => setSelected(p)} index={i} />
              ))}
            </motion.div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-bg-border/40 px-5 py-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <KaizenLogo variant="horizontal" size={24} className="opacity-50" />
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
              className="text-fg-muted hover:text-electric transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {selected && <ProductModal p={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}
