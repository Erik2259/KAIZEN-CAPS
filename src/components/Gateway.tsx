'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { KaizenLogo } from './KaizenLogo';

const TYPEWRITER = 'Acceso a la bóveda autorizado...';

export function Gateway({ onEnter }: { onEnter: () => void }) {
  const [typed, setTyped] = useState('');
  const [showBtn, setShowBtn] = useState(false);
  const [bannerErr, setBannerErr] = useState(false);
  const [logoErr, setLogoErr] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < TYPEWRITER.length) {
        setTyped(TYPEWRITER.slice(0, ++i));
      } else {
        clearInterval(t);
        setTimeout(() => setShowBtn(true), 400);
      }
    }, 55);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      key="gateway"
      className="fixed inset-0 z-[100] overflow-hidden"
      exit={{ y: '-100%', transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* Fondo — banner_vault.jpg o fallback off-black */}
      {!bannerErr ? (
        <Image
          src="/assets/banner_vault.jpg"
          alt=""
          fill
          priority
          className="object-cover scale-105"
          onError={() => setBannerErr(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[#0A0A0C]" />
      )}

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Tarjeta glassmorphism central */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-7 border border-white/10"
        >
          {/* Logo */}
          <div className="logo-pulse">
            {!logoErr ? (
              <Image
                src="/assets/logo.png"
                alt="KΛIZEN CΛPS"
                width={96}
                height={96}
                priority
                className="object-contain drop-shadow-[0_0_30px_rgba(0,71,255,.6)]"
                onError={() => setLogoErr(true)}
              />
            ) : (
              <KaizenLogo variant="mark" size={96} pulse />
            )}
          </div>

          {/* Typewriter */}
          <div className="text-center space-y-1.5">
            <p className="brand-mark text-[10px] tracking-[.4em] text-fg-muted uppercase">
              KΛIZEN CΛPS
            </p>
            <p className="text-sm text-fg font-mono min-h-[22px] tracking-wide">
              {typed}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="text-electric ml-0.5"
              >|</motion.span>
            </p>
          </div>

          {/* Botón con sheen */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: showBtn ? 1 : 0, y: showBtn ? 0 : 10 }}
            transition={{ duration: 0.45 }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
              className="btn-sheen brand-mark px-10 py-4 rounded-full bg-electric text-white text-sm tracking-[.25em] hover:shadow-[0_0_50px_rgba(0,71,255,.7)] transition-shadow"
            >
              [ ENTRΛR ]
            </motion.button>
          </motion.div>
        </motion.div>

        <p className="mt-8 text-[9px] text-fg-muted tracking-widest opacity-30">
          DROP 01 · ACCESO EXCLUSIVO
        </p>
      </div>
    </motion.div>
  );
}
