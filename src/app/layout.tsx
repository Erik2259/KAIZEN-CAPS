import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap', weight: ['500','600','700'] });

export const metadata: Metadata = {
  title: 'KΛIZEN CΛPS — Hype Drops',
  description: 'Boutique digital de gorras hypebeast calidad G5.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'KΛIZEN CΛPS' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${space.variable}`}>
      <body className="bg-bg text-fg font-sans grain">{children}</body>
    </html>
  );
}
