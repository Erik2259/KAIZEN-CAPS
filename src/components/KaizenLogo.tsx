'use client';

/**
 * KaizenLogo — Componente reutilizable del logo KΛIZEN CΛPS
 *
 * Variantes:
 *  - "mark"       → Solo el Enso (ícono cuadrado, para nav pequeño)
 *  - "horizontal" → Enso + texto KΛIZEN CΛPS lado a lado (LOGO.png)
 *  - "stacked"    → Enso grande + texto dentro/abajo (LOGOv2.png — gateway)
 */

type LogoVariant = 'mark' | 'horizontal' | 'stacked';

interface KaizenLogoProps {
  variant?: LogoVariant;
  size?: number;        // px del Enso mark
  className?: string;
  pulse?: boolean;      // activa logo-pulse CSS (gateway)
}

export function KaizenLogo({
  variant = 'horizontal',
  size = 48,
  className = '',
  pulse = false,
}: KaizenLogoProps) {

  const EnsoMark = ({ s }: { s: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={pulse ? 'logo-pulse' : ''}
      aria-hidden="true"
    >
      {/* Glow layer */}
      <path
        d="M 50 6 C 77 6, 95 24, 95 50 C 95 76, 77 95, 50 95 C 23 95, 5 76, 5 50 C 5 25, 21 9, 44 6.5"
        stroke="#0047FF" strokeWidth="18" strokeLinecap="round" opacity="0.12"
      />
      {/* Exterior rough edge */}
      <path
        d="M 50 6.5 C 76 6.5, 93 24, 93 50 C 93 76, 76 93.5, 50 93.5 C 24 93.5, 7 76, 7 50 C 7 26, 22 10, 44.5 6.8"
        stroke="#0033CC" strokeWidth="3.5" strokeLinecap="round" opacity="0.35"
      />
      {/* Inner texture */}
      <path
        d="M 50 10 C 73 10, 89 27, 89 50 C 89 73, 73 90, 50 90 C 27 90, 11 73, 11 50 C 11 30, 24 14, 46 10.5"
        stroke="#3366FF" strokeWidth="4" strokeLinecap="round" opacity="0.4"
      />
      {/* Main brushstroke */}
      <path
        d="M 50 8 C 75 8, 92 26, 92 50 C 92 74, 75 92, 50 92 C 26 92, 8 74, 8 50 C 8 28, 23 11, 45 8.2"
        stroke="#0047FF" strokeWidth="12" strokeLinecap="round"
      />
      {/* Brush tail — apertura del Enso */}
      <path
        d="M 45 8.2 C 47.5 7.4, 50.5 7.2, 50 8"
        stroke="#0047FF" strokeWidth="6" strokeLinecap="round" opacity="0.65"
      />
    </svg>
  );

  /* ── MARK ─────────────────────────────── */
  if (variant === 'mark') {
    return (
      <span className={className}>
        <EnsoMark s={size} />
      </span>
    );
  }

  /* ── HORIZONTAL (nav) ────────────────── */
  if (variant === 'horizontal') {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <EnsoMark s={size} />
        <span
          className="brand-mark text-fg"
          style={{ fontSize: size * 0.38, letterSpacing: '0.16em' }}
        >
          KΛIZEN CΛPS
        </span>
      </span>
    );
  }

  /* ── STACKED (gateway / hero) ────────── */
  return (
    <span className={`inline-flex flex-col items-center gap-4 ${className}`}>
      <EnsoMark s={size} />
      <span className="text-center">
        <span
          className="brand-mark block text-electric-gradient"
          style={{ fontSize: size * 0.22, letterSpacing: '0.22em' }}
        >
          KΛIZEN CΛPS
        </span>
        <span
          className="brand-mark block text-fg-muted mt-0.5"
          style={{ fontSize: size * 0.1, letterSpacing: '0.4em' }}
        >
          BOUTIQUE DIGITAL
        </span>
      </span>
    </span>
  );
}
