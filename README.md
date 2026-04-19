# KΛIZEN CΛPS

## Setup
1. Supabase → SQL Editor → ejecuta `supabase/schema.sql`
2. Supabase → Authentication → Providers → Email → desactiva "Confirm email"
3. Supabase → Authentication → Users → Add user → crea tu admin
4. `cp .env.local.example .env.local` y llena los 3 valores
5. `npm install && npm run dev`

## Rutas
- `/` — Boutique pública
- `/admin/login` — Login
- `/admin` — CRUD

## Deploy
Vercel → Import repo → agrega las 3 env vars (Production + Preview + Development) → Deploy.
