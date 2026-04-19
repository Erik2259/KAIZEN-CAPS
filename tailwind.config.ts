import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0A0A0C', card: '#16161A', border: '#2A2A35' },
        fg: { DEFAULT: '#EDEDED', muted: '#8A8A95' },
        electric: { DEFAULT: '#0047FF', glow: '#3366FF' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space)', 'system-ui', 'sans-serif'],
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        sheen: 'sheen 3s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 20px rgba(0,71,255,.3)', opacity: '0.9' },
          '50%': { boxShadow: '0 0 60px rgba(0,71,255,.8)', opacity: '1' },
        },
        sheen: {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '50%,100%': { transform: 'translateX(250%) skewX(-15deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
