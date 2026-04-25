'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, LogOut, Loader2, Image as ImageIcon,
  Package, BarChart2, Minus,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminForm } from '@/components/AdminForm';
import type { Producto, Venta, AnalyticsData } from '@/types';

type Tab = 'inventario' | 'analiticas';

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>('inventario');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb
        .from('kaizen_productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos((data ?? []) as Producto[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const sb = createClient();
      const [ventasRes, visitasRes, stockRes] = await Promise.all([
        sb.from('kaizen_ventas').select('*').order('created_at', { ascending: false }),
        sb.from('kaizen_visitas').select('*', { count: 'exact', head: true }),
        sb.from('kaizen_productos').select('stock'),
      ]);
      const ventas = (ventasRes.data ?? []) as Venta[];
      setAnalytics({
        totalGanancias: ventas.reduce((s, v) => s + v.precio, 0),
        totalStock: (stockRes.data ?? []).reduce((s, p) => s + (p.stock ?? 0), 0),
        visitas: visitasRes.count ?? 0,
        ventas,
      });
    } catch (e) { console.error(e); }
    finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const sb = createClient();
        const { data } = await sb.auth.getUser();
        if (!data.user) { router.replace('/admin/login'); return; }
        setAuthChecked(true);
      } catch { router.replace('/admin/login'); }
    };
    check();
  }, [router]);

  useEffect(() => { if (authChecked) fetchProductos(); }, [authChecked, fetchProductos]);
  useEffect(() => { if (authChecked && tab === 'analiticas') fetchAnalytics(); }, [authChecked, tab, fetchAnalytics]);

  const adjustStock = async (p: Producto, delta: number) => {
    const sb = createClient();
    await sb.from('kaizen_productos').update({ stock: Math.max(0, p.stock + delta) }).eq('id', p.id);
    fetchProductos();
  };

  const markSold = async (p: Producto) => {
    if (p.stock <= 0) return;
    const sb = createClient();
    await Promise.all([
      sb.from('kaizen_productos').update({ stock: p.stock - 1 }).eq('id', p.id),
      sb.from('kaizen_ventas').insert({ producto_id: p.id, nombre: p.nombre, precio: p.en_promocion && p.precio_oferta ? p.precio_oferta : p.precio, categoria: p.categoria }),
    ]);
    fetchProductos();
  };

  const handleDelete = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    const sb = createClient();
    const { error } = await sb.from('kaizen_productos').delete().eq('id', p.id);
    if (error) alert(error.message); else fetchProductos();
  };

  const handleLogout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.replace('/admin/login');
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p: Producto) => { setEditing(p); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  if (!authChecked) return (
    <main className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-electric" />
    </main>
  );

  return (
    <main className="bg-glow min-h-dvh pb-24">
      <header className="sticky top-0 z-30 px-5 py-4 backdrop-blur-lg bg-bg/70 border-b border-bg-border/40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest text-fg-muted uppercase">KΛIZEN CΛPS</p>
            <h1 className="brand-mark text-lg">Centro de Control</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-electric text-white text-xs font-semibold tracking-wide active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(0,71,255,.5)]">
              <Plus className="w-3.5 h-3.5" /> Nuevo
            </button>
            <button onClick={handleLogout} className="text-fg-muted hover:text-electric transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-5">
        <AnimatePresence mode="wait">

          {/* ── INVENTARIO ── */}
          {tab === 'inventario' && (
            <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="brand-mark text-sm tracking-widest">INVENTARIO</h2>
                <span className="text-xs text-fg-muted">{productos.length} total</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-electric" /></div>
              ) : productos.length === 0 ? (
                <p className="text-center text-sm text-fg-muted py-16">No hay productos.</p>
              ) : (
                <div className="space-y-3">
                  {productos.map(p => {
                    const imgs = p.imagenes?.length ? p.imagenes : p.imagen_url ? [p.imagen_url] : [];
                    const precioMostrar = p.en_promocion && p.precio_oferta ? p.precio_oferta : p.precio;
                    return (
                      <motion.div key={p.id} layout className="glass rounded-2xl p-3">
                        <div className="flex gap-3 items-start">
                          <div className="w-14 h-14 rounded-xl bg-bg border border-bg-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {imgs[0]
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={imgs[0]} alt={p.nombre} className="w-full h-full object-contain" />
                              : <ImageIcon className="w-5 h-5 text-fg-muted" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="brand-mark text-sm truncate">{p.nombre}</p>
                              {p.en_promocion && (
                                <span className="text-[8px] tracking-widest text-electric border border-electric/40 rounded px-1">PROMO</span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-xs text-electric font-semibold">${precioMostrar.toFixed(2)}</p>
                              {p.en_promocion && p.precio_oferta && (
                                <p className="text-[10px] text-fg-muted line-through">${p.precio.toFixed(2)}</p>
                              )}
                            </div>
                            <p className="text-[10px] text-fg-muted">{p.categoria}</p>
                          </div>

                          {/* Stock control */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <button onClick={() => adjustStock(p, -1)} disabled={p.stock <= 0}
                                className="w-6 h-6 rounded-full border border-bg-border flex items-center justify-center text-fg-muted hover:border-electric hover:text-electric transition-colors disabled:opacity-30">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={`text-sm font-bold w-6 text-center ${p.stock === 0 ? 'text-red-400' : p.stock <= 2 ? 'text-yellow-400' : 'text-electric'}`}>
                                {p.stock}
                              </span>
                              <button onClick={() => adjustStock(p, 1)}
                                className="w-6 h-6 rounded-full border border-bg-border flex items-center justify-center text-fg-muted hover:border-electric hover:text-electric transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[9px] text-fg-muted tracking-wide">stock</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-bg-border/40 flex items-center justify-between">
                          <div className="flex gap-3">
                            <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-fg-muted hover:text-electric transition-colors">
                              <Edit3 className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => handleDelete(p)} className="flex items-center gap-1 text-xs text-fg-muted hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" /> Borrar
                            </button>
                          </div>
                          <button onClick={() => markSold(p)} disabled={p.stock <= 0}
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-electric/10 border border-electric/30 text-electric hover:bg-electric hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            ✓ Vendido
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ANALÍTICAS ── */}
          {tab === 'analiticas' && (
            <motion.div key="anal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="brand-mark text-sm tracking-widest">ANALÍTICAS</h2>
                <button onClick={fetchAnalytics} className="text-[10px] text-fg-muted hover:text-electric transition-colors tracking-widest">
                  ↻ ACTUALIZAR
                </button>
              </div>

              {analyticsLoading || !analytics ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-electric" /></div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Ganancias Brutas', val: `$${analytics.totalGanancias.toFixed(0)}`, sub: 'MXN · total ventas' },
                      { label: 'Inventario', val: String(analytics.totalStock), sub: 'piezas restantes' },
                      { label: 'Visitas', val: String(analytics.visitas), sub: 'sesiones únicas' },
                      { label: 'Vendidas', val: String(analytics.ventas.length), sub: 'piezas totales' },
                    ].map(s => (
                      <div key={s.label} className="glass rounded-2xl p-4">
                        <p className="text-[10px] tracking-widest text-fg-muted uppercase mb-1">{s.label}</p>
                        <p className="brand-mark text-2xl text-electric">{s.val}</p>
                        <p className="text-[10px] text-fg-muted mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-bg-border">
                      <h3 className="brand-mark text-[11px] tracking-widest text-fg-muted uppercase">Historial de Ventas</h3>
                    </div>
                    {analytics.ventas.length === 0 ? (
                      <p className="text-center text-xs text-fg-muted py-8">Sin ventas registradas aún.</p>
                    ) : (
                      <div className="divide-y divide-bg-border/40 max-h-[360px] overflow-y-auto">
                        {analytics.ventas.map(v => (
                          <div key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm truncate">{v.nombre}</p>
                              <p className="text-[10px] text-fg-muted">
                                {v.categoria} · {new Date(v.created_at).toLocaleDateString('es-MX', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <p className="text-electric text-sm font-bold flex-shrink-0">${v.precio.toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg/90 backdrop-blur-xl border-t border-bg-border/60">
        <div className="max-w-2xl mx-auto flex items-center">
          <button onClick={() => setTab('inventario')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] tracking-widest uppercase transition-colors ${tab === 'inventario' ? 'text-electric' : 'text-fg-muted'}`}>
            <Package className="w-5 h-5" />Inventario
          </button>
          <div className="flex items-center justify-center px-4">
            <button onClick={openNew}
              className="w-14 h-14 -mt-7 rounded-full bg-electric flex items-center justify-center shadow-[0_0_30px_rgba(0,71,255,.5)] active:scale-90 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
          <button onClick={() => setTab('analiticas')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] tracking-widest uppercase transition-colors ${tab === 'analiticas' ? 'text-electric' : 'text-fg-muted'}`}>
            <BarChart2 className="w-5 h-5" />Métricas
          </button>
        </div>
      </nav>

      {/* FORM */}
      <AnimatePresence>
        {showForm && (
          <AdminForm
            editing={editing}
            onSuccess={() => { closeForm(); fetchProductos(); }}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
