'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Info, MapPin, Bike } from 'lucide-react';
import type { Producto } from '@/types';

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

type Step = 'detail' | 'capture' | 'logistics';
type Intent = 'buy' | 'info';

function buildWA(p: Producto, nombre: string, intent: Intent, logistica?: string) {
  const precio = p.en_promocion && p.precio_oferta ? p.precio_oferta : p.precio;
  let msg = '';
  if (intent === 'buy') {
    msg = [
      `KΛIZEN CΛPS. Soy ${nombre}.`,
      `Quiero asegurar la pieza *${p.nombre}* por $${precio.toFixed(2)} MXN.`,
      `Mi opción de entrega es: *${logistica}*.`,
      `Listo para cerrar el trato. 🔒`,
    ].join('\n');
  } else {
    msg = [
      `KΛIZEN CΛPS. Soy ${nombre}.`,
      `Me interesa la pieza *${p.nombre}*.`,
      `¿Podrían darme más información?`,
    ].join('\n');
  }
  return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}

function getImages(p: Producto): string[] {
  if (p.imagenes?.length) return p.imagenes;
  if (p.imagen_url) return [p.imagen_url];
  return [];
}

/* ── Mini carousel ─────────────────────────────────────── */
function ImageCarousel({ images, nombre }: { images: string[]; nombre: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const fn = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on('select', fn);
    return () => { emblaApi.off('select', fn); };
  }, [emblaApi]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!images.length) {
    return (
      <div className="w-full h-full bg-bg-card flex items-center justify-center text-fg-muted text-xs">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={emblaRef} className="overflow-hidden w-full h-full">
        <div className="flex h-full">
          {images.map((url, i) => (
            <div key={i} className="flex-[0_0_100%] relative h-full">
              <Image
                src={url}
                alt={`${nombre} — ${i + 1}`}
                fill
                sizes="(max-width:640px) 100vw, 50vw"
                className="object-contain p-6 animate-float drop-shadow-[0_20px_40px_rgba(0,71,255,.4)]"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg/80 border border-bg-border flex items-center justify-center active:scale-90 z-10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg/80 border border-bg-border flex items-center justify-center active:scale-90 z-10">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)}
                className={`embla-dot ${i === current ? 'active' : ''}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main Modal ────────────────────────────────────────── */
export function ProductModal({ p, onClose }: { p: Producto; onClose: () => void }) {
  const [step, setStep] = useState<Step>('detail');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const imgs = getImages(p);
  const precio = p.en_promocion && p.precio_oferta ? p.precio_oferta : p.precio;

  const fireWA = (logistica?: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(50);
    window.open(buildWA(p, nombre, intent!, logistica), '_blank', 'noreferrer');
    onClose();
  };

  const handleCaptureNext = (chosen: Intent) => {
    if (!nombre.trim()) return;
    setIntent(chosen);
    if (chosen === 'info') {
      fireWA();
    } else {
      setStep('logistics');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${p.id}`}
        onClick={e => e.stopPropagation()}
        className="glass relative w-full sm:max-w-2xl max-h-[92dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col sm:grid sm:grid-cols-2"
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        {/* Close */}
        <button onClick={onClose} aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-bg/80 backdrop-blur border border-bg-border flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-4 h-4" />
        </button>

        {/* Handle mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 relative z-20">
          <div className="w-10 h-1 rounded-full bg-bg-border" />
        </div>

        {/* IMAGE COL — se reduce en pasos de formulario */}
        <motion.div
          layoutId={`img-${p.id}`}
          animate={{ height: step === 'detail' ? 'auto' : '160px' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="flex-shrink-0 sm:h-full relative bg-gradient-to-b from-electric/5 to-transparent"
          style={{ minHeight: step === 'detail' ? '240px' : '160px' }}
        >
          <ImageCarousel images={imgs} nombre={p.nombre} />
        </motion.div>

        {/* RIGHT COL */}
        <div className="flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── STEP: DETAIL ── */}
            {step === 'detail' && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
                  <motion.span layoutId={`cat-${p.id}`}
                    className="text-[9px] tracking-widest uppercase text-fg-muted px-2 py-0.5 rounded-full border border-bg-border bg-bg/80">
                    {p.categoria}
                  </motion.span>

                  <motion.div layoutId={`info-${p.id}`} className="mt-3">
                    <motion.h2 layoutId={`name-${p.id}`} className="brand-mark text-2xl md:text-3xl">
                      {p.nombre}
                    </motion.h2>

                    {/* Precio con promo */}
                    <motion.div layoutId={`price-${p.id}`} className="mt-2 flex items-baseline gap-2">
                      {p.en_promocion && p.precio_oferta ? (
                        <>
                          <span className="text-electric text-3xl font-bold">
                            ${p.precio_oferta.toFixed(2)}
                          </span>
                          <span className="text-fg-muted text-base line-through">
                            ${p.precio.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-electric border border-electric/40 rounded px-1 py-0.5 tracking-widest">
                            PROMO
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-electric text-3xl font-bold">
                            ${p.precio.toFixed(2)}
                          </span>
                          <span className="text-sm text-fg-muted">MXN</span>
                        </>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Stock urgency */}
                  {p.stock > 0 && p.stock < 3 && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4 }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-900/30 border border-red-500/40 text-xs text-red-300"
                    >
                      🔥 Solo quedan {p.stock} piezas en la bóveda
                    </motion.div>
                  )}

                  {p.descripcion && (
                    <p className="mt-4 text-sm text-fg-muted leading-relaxed whitespace-pre-line">
                      {p.descripcion}
                    </p>
                  )}

                  <ul className="mt-5 space-y-1.5 text-xs text-fg-muted">
                    {['Selección curada de lujo', 'Stock exclusivo del drop', 'Envío o entrega en zona'].map(t => (
                      <li key={t} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-electric flex-shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="flex-shrink-0 p-4 border-t border-bg-border bg-bg/80 backdrop-blur">
                  <button
                    onClick={() => setStep('capture')}
                    disabled={p.stock === 0}
                    className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold tracking-wide active:scale-[0.97] transition-all hover:shadow-[0_0_40px_rgba(0,71,255,.6)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    [ INICIΛR COMPRΛ ]
                  </button>
                  <p className="mt-2 text-center text-[9px] text-fg-muted tracking-widest">
                    CHECKOUT DIRECTO · RESPUESTA INMEDIATA
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: CAPTURE ── */}
            {step === 'capture' && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto px-6 pt-5 pb-2">
                  <button onClick={() => setStep('detail')}
                    className="flex items-center gap-1 text-[10px] text-fg-muted hover:text-electric transition-colors mb-4 tracking-widest uppercase">
                    <ChevronLeft className="w-3 h-3" /> Volver
                  </button>

                  <h3 className="brand-mark text-xl tracking-wide mb-1">Un paso más</h3>
                  <p className="text-xs text-fg-muted mb-6">
                    Para asegurarte la pieza necesitamos tus datos.
                  </p>

                  {/* Nombre */}
                  <div className="mb-4">
                    <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Tu Nombre</label>
                    <input
                      type="text"
                      autoFocus
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Erik"
                      className="kaizen-input"
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="mb-6">
                    <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Tu Teléfono</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      placeholder="Ej: 771 234 5678"
                      className="kaizen-input"
                    />
                  </div>

                  <p className="text-[10px] text-fg-muted text-center mb-4 tracking-widest uppercase">¿Cuál es tu intención?</p>
                </div>

                {/* Botones de intención */}
                <div className="flex-shrink-0 p-4 border-t border-bg-border space-y-3">
                  <button
                    onClick={() => handleCaptureNext('buy')}
                    disabled={!nombre.trim()}
                    className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold tracking-wide active:scale-[0.97] transition-all disabled:opacity-40 hover:shadow-[0_0_30px_rgba(0,71,255,.5)]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    [ QUIERO COMPRΛR YΛ ]
                  </button>
                  <button
                    onClick={() => handleCaptureNext('info')}
                    disabled={!nombre.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-bg-border text-fg-muted text-sm font-semibold tracking-wide active:scale-[0.97] transition-all disabled:opacity-40 hover:border-fg-muted/50"
                  >
                    <Info className="w-4 h-4" />
                    Solo deseo información
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: LOGISTICS ── */}
            {step === 'logistics' && (
              <motion.div
                key="logistics"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto px-6 pt-5 pb-2">
                  <button onClick={() => setStep('capture')}
                    className="flex items-center gap-1 text-[10px] text-fg-muted hover:text-electric transition-colors mb-4 tracking-widest uppercase">
                    <ChevronLeft className="w-3 h-3" /> Volver
                  </button>

                  <h3 className="brand-mark text-xl tracking-wide mb-1">Logística</h3>
                  <p className="text-xs text-fg-muted mb-2">en Tulancingo.</p>

                  <div className="mt-4 p-3 glass rounded-xl border border-bg-border mb-2">
                    <p className="text-xs text-fg-muted">
                      <span className="text-fg font-semibold">{nombre}</span> · {p.nombre}
                    </p>
                    <p className="text-electric text-sm font-bold mt-0.5">
                      ${precio.toFixed(2)} MXN
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 p-4 border-t border-bg-border space-y-3">
                  <button
                    onClick={() => fireWA('Punto Medio')}
                    className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold tracking-wide active:scale-[0.97] transition-all hover:shadow-[0_0_30px_rgba(0,71,255,.5)]"
                  >
                    <MapPin className="w-4 h-4" />
                    [ PUNTO MEDIO ]
                  </button>
                  <button
                    onClick={() => fireWA('Envío a Domicilio')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-bg-border text-fg-muted text-sm font-semibold tracking-wide active:scale-[0.97] transition-all hover:border-electric hover:text-electric"
                  >
                    <Bike className="w-4 h-4" />
                    Envío a Domicilio
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
