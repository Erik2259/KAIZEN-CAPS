#!/usr/bin/env bash
# ================================================================
# KΛIZEN CΛPS — Setup Script v5
# Ejecutar UNA SOLA VEZ en la raíz del proyecto clonado:
#   chmod +x setup_kaizen.sh && ./setup_kaizen.sh
# ================================================================
set -e

echo ""
echo "╔════════════════════════════════╗"
echo "║   KΛIZEN CΛPS — Setup v5      ║"
echo "╚════════════════════════════════╝"
echo ""

# 1) Carpeta de assets pública
echo "▶ Creando public/assets..."
mkdir -p public/assets
if [ ! -f "public/assets/README.txt" ]; then
cat > public/assets/README.txt << 'ASSETS'
KΛIZEN CΛPS — Assets Drop & Go
================================
Arrastra tus archivos aquí y el código los toma automáticamente:

  logo.png           → Logo para Gateway y nav (PNG fondo transparente)
  banner_vault.jpg   → Fondo del Gateway + hero desktop

Resoluciones recomendadas:
  logo.png           → 200x200 px (mínimo)
  banner_vault.jpg   → 1920x1080 px (landscape)

Sin estos archivos, el código usa el fallback SVG integrado.
ASSETS
fi

# 2) .env.local si no existe
if [ ! -f ".env.local" ]; then
  echo "▶ Creando .env.local de ejemplo..."
  cp .env.local.example .env.local 2>/dev/null || cat > .env.local << 'ENV'
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_WHATSAPP_NUMBER=521XXXXXXXXXX
ENV
fi

# 3) Instalar dependencias
echo "▶ Instalando dependencias..."
npm install

echo ""
echo "✅ Setup completo."
echo ""
echo "   Próximos pasos:"
echo "   1. Edita .env.local con tus keys de Supabase"
echo "   2. Arrastra logo.png y banner_vault.jpg a public/assets/"
echo "   3. Ejecuta: npm run dev"
echo "   4. Boutique → http://localhost:3000"
echo "   5. Admin   → http://localhost:3000/admin/login"
echo ""
