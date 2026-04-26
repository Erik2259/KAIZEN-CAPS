'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import {
  X, ChevronLeft, ChevronRight, ShoppingBag,
  Info, MapPin, Bike, User, Phone,
} from 'lucide-react';
import type { Producto } from '@/types';

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

type Step = 'detail' | 'capture' | 'logistics';
type Intent = 'buy' | 'info';

function buildWA(p: Producto, nombre: string, intent: Intent, logistica?: string) {
  const precio = p.en_promocion && p.precio_oferta ? p.precio_oferta : p.precio;
  const msg =
    intent === 'buy'
      ? [
          `KΛIZEN CΛPS. Soy ${nombre}.`,
          `Quiero asegurar la pieza *${p.nombre}* por $${precio.toFixed(2)} MXN.`,
          `Mi opción de entrega: *${logistica}*.`,
          `Listo para cerrar el trato. 🔒`,
        ].join('\n')
      : [
          `KΛIZEN CΛPS. Soy ${nombre}.`,
          `Me interesa la pieza *${p.nombre}*.`,
          `¿Podrían darme más información?`,
        ].join('\n');
  return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}

function getImages(p: Producto): string[] {
  if (p.imagenes?.length) return p.imagenes;
  if (p.imagen_url) return [p.imagen_url];
  return [];
}

/* ─────────────────────────────────────────────────────────────
   ZOOMABLE IMAGE — pinch to zoom + double tap reset
───────────────────────────────────────────────────────────── */
function ZoomableImage({ src, alt, onZoomChange }: {
  src: string;
  alt: string;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const lastDist = useRef<number | null>(null);
  const lastMid = useRef({ x: 0, y: 0 });

  const getDist = (t: React.TouchList) => {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    onZoomChange(false);
  }, [onZoomChange]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = getDist(e.touches);
      lastMid.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) reset();
      lastTap.current = now;
      lastMid.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      if (lastDist.current === null) return;
      const newDist = getDist(e.touches);
      const newScale = Math.min(4, Math.max(1, scale * (newDist / lastDist.current)));
      lastDist.current = newDist;
      setScale(newScale);
      onZoomChange(newScale > 1.05);
    } else if (e.touches.length === 1 && scale > 1.05) {
      e.stopPropagation();
      const dx = e.touches[0].clientX - lastMid.current.x;
      const dy = e.touches[0].clientY - lastMid.current.y;
      lastMid.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  };

  const onTouchEnd = () => {
    lastDist.current = null;
    if (scale < 1.05) reset();
  };

  const isZoomed = scale > 1.05;

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
          transformOrigin: 'center center',
          transition: isZoomed ? 'none' : 'transform 0.3s ease',
          willChange: 'transform',
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width:640px) 100vw, 50vw"
          className="object-contain p-6 drop-shadow-[0_20px_40px_rgba(0,71,255,.4)]"
          priority
          draggable={false}
        />
      </div>

      {/* Hint */}
      {!isZoomed && (
        <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-[#2A2A35] tracking-widest pointer-events-none select-none">
          PELLIZCA PARA ZOOM · DOBLE TAP PARA RESET
        </span>
      )}

      {/* Reset button cuando zoomed */}
      {isZoomed && (
        <button
          onClick={reset}
          className="absolute top-2 left-2 z-20 text-[9px] tracking-widest text-[#8A8A95] bg-[#0A0A0C]/80 border border-[#2A2A35] rounded-full px-2.5 py-1 active:scale-95 transition-transform"
        >
          ↺ RESET
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMBLA CAROUSEL — con zoom integrado
───────────────────────────────────────────────────────────── */
function ImageCarousel({ images, nombre }: { images: string[]; nombre: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, watchDrag: !isZoomed });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const fn = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on('select', fn);
    return () => { emblaApi.off('select', fn); };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ watchDrag: !isZoomed });
  }, [isZoomed, emblaApi]);

  const prev = useCallback(() => { if (!isZoomed) emblaApi?.scrollPrev(); }, [emblaApi, isZoomed]);
  const next = useCallback(() => { if (!isZoomed) emblaApi?.scrollNext(); }, [emblaApi, isZoomed]);

  if (!images.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0A0A0C]">
        <span className="text-[#8A8A95] text-xs tracking-widest uppercase">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={emblaRef} className="overflow-hidden w-full h-full">
        <div className="flex h-full">
          {images.map((url, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] relative h-full bg-gradient-to-b from-[#0047FF]/5 to-transparent"
            >
              <ZoomableImage
                src={url}
                alt={`${nombre} — ${i + 1}`}
                onZoomChange={setIsZoomed}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows y dots — ocultos con zoom */}
      {images.length > 1 && !isZoomed && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#0A0A0C]/80 border border-[#2A2A35] flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-4 h-4 text-[#EDEDED]" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#0A0A0C]/80 border border-[#2A2A35] flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight className="w-4 h-4 text-[#EDEDED]" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`embla-dot ${i === current ? 'active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRODUCT MODAL
───────────────────────────────────────────────────────────── */
export function ProductModal({
  p,
  onClose,
}: {
  p: Producto;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>('detail');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dragY, setDragY] = useState(0);
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
    if (chosen === 'info') fireWA();
    else setStep('logistics');
  };

  /* ── Detail ── */
  const DetailContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scroll-ios px-5 pt-4 pb-2">
        <span className="text-[9px] tracking-widest uppercase text-[#8A8A95] px-2 py-0.5 rounded-full border border-[#2A2A35] bg-[#0A0A0C]/80">
          {p.categoria}
        </span>

        <h2 className="brand-mark text-2xl md:text-3xl mt-3 leading-tight">{p.nombre}</h2>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          {p.en_promocion && p.precio_oferta ? (
            <>
              <span className="text-[#0047FF] text-3xl font-bold">${p.precio_oferta.toFixed(2)}</span>
              <span className="text-[#8A8A95] text-base line-through">${p.precio.toFixed(2)}</span>
              <span className="text-[9px] tracking-widest text-[#0047FF] border border-[#0047FF]/40 rounded px-1.5 py-0.5">PROMO</span>
            </>
          ) : (
            <>
              <span className="text-[#0047FF] text-3xl font-bold">${p.precio.toFixed(2)}</span>
              <span className="text-sm text-[#8A8A95]">MXN</span>
            </>
          )}
        </div>

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
          <p className="mt-4 text-sm text-[#8A8A95] leading-relaxed whitespace-pre-line">
            {p.descripcion}
          </p>
        )}

        <ul className="mt-5 space-y-2">
          {['Selección curada de lujo', 'Stock exclusivo del drop', 'Envío o entrega en zona'].map(t => (
            <li key={t} className="flex items-center gap-2 text-xs text-[#8A8A95]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-shrink-0 px-5 pt-3 pb-safe border-t border-[#2A2A35] bg-[#0A0A0C]">
        <button
          onClick={() => setStep('capture')}
          disabled={p.stock === 0}
          className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#0047FF] text-white font-semibold tracking-wide active:scale-[0.97] transition-all hover:shadow-[0_0_40px_rgba(0,71,255,.6)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" />
          [ INICIΛR COMPRΛ ]
        </button>
        <p className="mt-2 text-center text-[9px] text-[#8A8A95] tracking-widest pb-1">
          CHECKOUT DIRECTO · RESPUESTA INMEDIATA
        </p>
      </div>
    </div>
  );

  /* ── Capture ── */
  const CaptureContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scroll-ios px-5 pt-4 pb-2">
        <button
          onClick={() => setStep('detail')}
          className="flex items-center gap-1 text-[10px] text-[#8A8A95] hover:text-[#0047FF] transition-colors mb-5 tracking-widest uppercase"
        >
          <ChevronLeft className="w-3 h-3" /> Volver
        </button>

        <h3 className="brand-mark text-xl leading-tight mb-1">Un paso más</h3>
        <p className="text-xs text-[#8A8A95] mb-6 leading-relaxed">
          Para asegurarte la pieza necesitamos tus datos. Solo tarda 10 segundos.
        </p>

        <label className="block text-[10px] tracking-widest text-[#8A8A95] uppercase mb-1.5">Tu Nombre</label>
        <div className="relative mb-4">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A95]" />
          <input
            type="text"
            autoComplete="given-name"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Erik"
            className="kaizen-input pl-10"
          />
        </div>

        <label className="block text-[10px] tracking-widest text-[#8A8A95] uppercase mb-1.5">Tu Teléfono</label>
        <div className="relative mb-4">
          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A95]" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="771 234 5678"
            className="kaizen-input pl-10"
          />
        </div>

        <div className="glass rounded-xl p-3 flex items-center justify-between mt-2">
          <div>
            <p className="text-xs text-[#8A8A95]">Pieza seleccionada</p>
            <p className="text-sm font-semibold truncate max-w-[160px]">{p.nombre}</p>
          </div>
          <p className="text-[#0047FF] font-bold">${precio.toFixed(0)} MXN</p>
        </div>
      </div>

      <div className="flex-shrink-0 px-5 pt-3 pb-safe border-t border-[#2A2A35] bg-[#0A0A0C] space-y-2.5">
        <p className="text-[9px] text-center text-[#8A8A95] tracking-widest uppercase mb-1">¿Cuál es tu intención?</p>
        <button
          onClick={() => handleCaptureNext('buy')}
          disabled={!nombre.trim()}
          className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#0047FF] text-white font-semibold tracking-wide active:scale-[0.97] transition-all disabled:opacity-40 hover:shadow-[0_0_30px_rgba(0,71,255,.5)]"
        >
          <ShoppingBag className="w-4 h-4" />
          [ QUIERO COMPRΛR YΛ ]
        </button>
        <button
          onClick={() => handleCaptureNext('info')}
          disabled={!nombre.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#2A2A35] text-[#8A8A95] text-sm font-semibold tracking-wide active:scale-[0.97] transition-all disabled:opacity-40"
        >
          <Info className="w-4 h-4" />
          Solo deseo información
        </button>
      </div>
    </div>
  );

  /* ── Logistics ── */
  const LogisticsContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scroll-ios px-5 pt-4 pb-2">
        <button
          onClick={() => setStep('capture')}
          className="flex items-center gap-1 text-[10px] text-[#8A8A95] hover:text-[#0047FF] transition-colors mb-5 tracking-widest uppercase"
        >
          <ChevronLeft className="w-3 h-3" /> Volver
        </button>

        <h3 className="brand-mark text-xl leading-tight mb-1">¿Cómo la recibiste?</h3>
        <p className="text-xs text-[#8A8A95] mb-6">Logística en Tulancingo.</p>

        <div className="glass rounded-xl p-3 mb-4">
          <p className="text-[10px] text-[#8A8A95] uppercase tracking-widest mb-1">Confirmación</p>
          <p className="text-sm font-semibold">{nombre}</p>
          <p className="text-[#8A8A95] text-xs">{p.nombre}</p>
          <p className="text-[#0047FF] font-bold mt-1">${precio.toFixed(2)} MXN</p>
        </div>
      </div>

      <div className="flex-shrink-0 px-5 pt-3 pb-safe border-t border-[#2A2A35] bg-[#0A0A0C] space-y-2.5">
        <button
          onClick={() => fireWA('Punto Medio')}
          className="btn-sheen w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#0047FF] text-white font-semibold tracking-wide active:scale-[0.97] transition-all hover:shadow-[0_0_30px_rgba(0,71,255,.5)]"
        >
          <MapPin className="w-4 h-4" />
          [ CONFIRMΛR · PUNTO MEDIO ]
        </button>
        <button
          onClick={() => fireWA('Envío a Domicilio')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#2A2A35] text-[#8A8A95] text-sm font-semibold tracking-wide active:scale-[0.97] transition-all hover:border-[#0047FF] hover:text-[#0047FF]"
        >
          <Bike className="w-4 h-4" />
          [ CONFIRMΛR · ENVÍO A DOMICILIO ]
        </button>
      </div>
    </div>
  );

  const stepContent: Record<Step, React.ReactNode> = {
    detail: DetailContent,
    capture: CaptureContent,
    logistics: LogisticsContent,
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
        onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
        style={{ y: dragY > 0 ? dragY : 0 }}
        onClick={e => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="
          fixed inset-x-0 bottom-0
          h-[90dvh]
          rounded-t-3xl
          bg-[#0A0A0C]
          border-t border-x border-[#2A2A35]
          flex flex-col
          overflow-hidden
          will-change-transform
          md:relative md:inset-auto
          md:max-w-2xl md:w-full
          md:h-auto md:max-h-[85dvh]
          md:rounded-3xl
          md:border
          md:grid md:grid-cols-2
        "
      >
        {/* Handle bar móvil */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#2A2A35]" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#0A0A0C]/90 backdrop-blur border border-[#2A2A35] flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Imagen */}
        <div className="relative flex-shrink-0 h-[40dvh] md:h-full md:min-h-[400px] bg-gradient-to-b from-[#0047FF]/5 to-transparent">
          <ImageCarousel images={imgs} nombre={p.nombre} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-h-0 flex flex-col md:max-h-[85dvh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 'detail' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === 'detail' ? 20 : -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col h-full"
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
