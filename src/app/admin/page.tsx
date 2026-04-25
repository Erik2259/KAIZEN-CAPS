'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, LogOut, Upload, Loader2, Check, X,
  Image as ImageIcon, Package, BarChart2, Minus,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Producto, Venta, AnalyticsData } from '@/types';

const CATEGORIAS = ['KΛIZEN Essentials', 'Hype Selection', 'The Vault'] as const;
type Tab = 'inventario' | 'analiticas';

interface FormState {
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
  stock: string;
  existingImages: string[];
}
const emptyForm: FormState = {
  nombre: '', descripcion: '', precio: '', categoria: 'KΛIZEN Essentials', stock: '1', existingImages: [],
};

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>('inventario');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb
        .from('kaizen_productos')
        .select('*')
        .order('created_at', { ascending: false });
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
      const totalGanancias = ventas.reduce((sum, v) => sum + v.precio, 0);
      const totalStock = (stockRes.data ?? []).reduce((sum, p) => sum + (p.stock ?? 0), 0);
      setAnalytics({
        totalGanancias,
        totalStock,
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

  useEffect(() => {
    if (authChecked) fetchProductos();
  }, [authChecked, fetchProductos]);

  useEffect(() => {
    if (authChecked && tab === 'analiticas') fetchAnalytics();
  }, [authChecked, tab, fetchAnalytics]);

  // Stock adjust
  const adjustStock = async (p: Producto, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    const sb = createClient();
    await sb.from('kaizen_productos').update({ stock: newStock }).eq('id', p.id);
    fetchProductos();
  };

  // Marcar vendido: stock -1 + insert en ventas
  const markSold = async (p: Producto) => {
    if (p.stock <= 0) return;
    const sb = createClient();
    await Promise.all([
      sb.from('kaizen_productos').update({ stock: p.stock - 1 }).eq('id', p.id),
      sb.from('kaizen_ventas').insert({
        producto_id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        categoria: p.categoria,
      }),
    ]);
    fetchProductos();
  };

  const openNew = () => {
    setEditing(null); setForm(emptyForm); setFiles([]); setPreviews([]); setShowForm(true);
  };
  const openEdit = (p: Producto) => {
    const imgs = (p.imagenes?.length ? p.imagenes : p.imagen_url ? [p.imagen_url] : []);
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      categoria: p.categoria,
      stock: String(p.stock),
      existingImages: imgs,
    });
    setFiles([]); setPreviews(imgs); setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false); setEditing(null); setForm(emptyForm); setFiles([]); setPreviews([]);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const uploadImages = async (sb: ReturnType<typeof createClient>): Promise<string[]> => {
    if (files.length === 0) return form.existingImages;
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const filename = `kaizen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from('imagenes').upload(filename, file, {
        cacheControl: '3600', upsert: false, contentType: file.type,
      });
      if (error) { alert('Error subiendo: ' + error.message); continue; }
      const { data } = sb.storage.from('imagenes').getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock, 10);
    if (isNaN(precio) || isNaN(stock)) { alert('Precio o stock inválido'); return; }
    setSaving(true);
    try {
      const sb = createClient();
      const imagenes = await uploadImages(sb);
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        categoria: form.categoria,
        stock,
        imagenes,
        imagen_url: imagenes[0] ?? null,
      };
      const { error } = editing
        ? await sb.from('kaizen_productos').update(payload).eq('id', editing.id)
        : await sb.from('kaizen_productos').insert(payload);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
      setSaving(false); closeForm(); fetchProductos();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); setSaving(false); }
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

  if (!authChecked) return (
    <main className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-electric" />
    </main>
  );

  return (
    <main className="bg-glow min-h-dvh pb-24">
      {/* Header */}
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
            <button onClick={handleLogout}
              className="text-fg-muted hover:text-electric transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-5">
        <AnimatePresence mode="wait">

          {/* ── INVENTARIO ── */}
          {tab === 'inventario' && (
            <motion.div key="inventario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="brand-mark text-sm tracking-widest">INVENTARIO</h2>
                <span className="text-xs text-fg-muted">{productos.length} total</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-electric" />
                </div>
              ) : productos.length === 0 ? (
                <p className="text-center text-sm text-fg-muted py-16">No hay productos.</p>
              ) : (
                <div className="space-y-3">
                  {productos.map(p => {
                    const imgs = p.imagenes?.length ? p.imagenes : p.imagen_url ? [p.imagen_url] : [];
                    return (
                      <motion.div key={p.id} layout className="glass rounded-2xl p-3">
                        <div className="flex gap-3 items-start">
                          {/* Thumb */}
                          <div className="w-14 h-14 rounded-xl bg-bg border border-bg-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {imgs[0]
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={imgs[0]} alt={p.nombre} className="w-full h-full object-contain" />
                              : <ImageIcon className="w-5 h-5 text-fg-muted" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="brand-mark text-sm truncate">{p.nombre}</p>
                            <p className="text-xs text-electric font-semibold">${p.precio.toFixed(2)}</p>
                            <p className="text-[10px] text-fg-muted">{p.categoria}</p>
                          </div>

                          {/* Stock control */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => adjustStock(p, -1)}
                                disabled={p.stock <= 0}
                                className="w-6 h-6 rounded-full border border-bg-border flex items-center justify-center text-fg-muted hover:border-electric hover:text-electric transition-colors disabled:opacity-30">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={`text-sm font-bold w-6 text-center ${p.stock === 0 ? 'text-red-400' : p.stock <= 2 ? 'text-yellow-400' : 'text-electric'}`}>
                                {p.stock}
                              </span>
                              <button
                                onClick={() => adjustStock(p, 1)}
                                className="w-6 h-6 rounded-full border border-bg-border flex items-center justify-center text-fg-muted hover:border-electric hover:text-electric transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[9px] text-fg-muted tracking-wide">stock</span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="mt-2.5 pt-2.5 border-t border-bg-border/40 flex items-center justify-between">
                          <div className="flex gap-3">
                            <button onClick={() => openEdit(p)}
                              className="flex items-center gap-1 text-xs text-fg-muted hover:text-electric transition-colors">
                              <Edit3 className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => handleDelete(p)}
                              className="flex items-center gap-1 text-xs text-fg-muted hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" /> Borrar
                            </button>
                          </div>
                          <button
                            onClick={() => markSold(p)}
                            disabled={p.stock <= 0}
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-electric/10 border border-electric/30 text-electric hover:bg-electric hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <Check className="w-3 h-3" /> Marcar vendido
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
            <motion.div key="analiticas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="brand-mark text-sm tracking-widest">ANALÍTICAS</h2>
                <button onClick={fetchAnalytics} className="text-[10px] text-fg-muted hover:text-electric transition-colors tracking-widest">
                  ↻ ACTUALIZAR
                </button>
              </div>

              {analyticsLoading || !analytics ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-electric" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[10px] tracking-widest text-fg-muted uppercase mb-1">Ganancias Brutas</p>
                      <p className="brand-mark text-2xl text-electric">
                        ${analytics.totalGanancias.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-fg-muted mt-0.5">MXN · total ventas</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[10px] tracking-widest text-fg-muted uppercase mb-1">Inventario</p>
                      <p className="brand-mark text-2xl text-electric">{analytics.totalStock}</p>
                      <p className="text-[10px] text-fg-muted mt-0.5">piezas restantes</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[10px] tracking-widest text-fg-muted uppercase mb-1">Visitas</p>
                      <p className="brand-mark text-2xl text-electric">{analytics.visitas}</p>
                      <p className="text-[10px] text-fg-muted mt-0.5">sesiones únicas</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[10px] tracking-widest text-fg-muted uppercase mb-1">Ventas</p>
                      <p className="brand-mark text-2xl text-electric">{analytics.ventas.length}</p>
                      <p className="text-[10px] text-fg-muted mt-0.5">piezas vendidas</p>
                    </div>
                  </div>

                  {/* Historial */}
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-bg-border">
                      <h3 className="brand-mark text-[11px] tracking-widest text-fg-muted uppercase">
                        Historial de Ventas
                      </h3>
                    </div>
                    {analytics.ventas.length === 0 ? (
                      <p className="text-center text-xs text-fg-muted py-8">
                        Sin ventas registradas aún.
                      </p>
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
                            <p className="text-electric text-sm font-bold flex-shrink-0">
                              ${v.precio.toFixed(0)}
                            </p>
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

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg/90 backdrop-blur-xl border-t border-bg-border/60">
        <div className="max-w-2xl mx-auto flex items-center">
          <button onClick={() => setTab('inventario')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] tracking-widest uppercase transition-colors ${tab === 'inventario' ? 'text-electric' : 'text-fg-muted'}`}>
            <Package className="w-5 h-5" />
            Inventario
          </button>
          <div className="flex items-center justify-center px-4">
            <button onClick={openNew}
              className="w-14 h-14 -mt-7 rounded-full bg-electric flex items-center justify-center shadow-[0_0_30px_rgba(0,71,255,.5)] active:scale-90 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
          <button onClick={() => setTab('analiticas')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] tracking-widest uppercase transition-colors ${tab === 'analiticas' ? 'text-electric' : 'text-fg-muted'}`}>
            <BarChart2 className="w-5 h-5" />
            Métricas
          </button>
        </div>
      </nav>

      {/* ── FORM SHEET ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
            animate={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={closeForm}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.form
              onSubmit={handleSubmit}
              onClick={e => e.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="glass w-full max-w-md rounded-t-3xl max-h-[94dvh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-bg-card/95 backdrop-blur px-5 py-4 border-b border-bg-border flex items-center justify-between z-10">
                <h2 className="brand-mark text-base">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button type="button" onClick={closeForm}
                  className="w-8 h-8 rounded-full bg-bg border border-bg-border flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Multi-image */}
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-2">
                    Imágenes <span className="text-electric normal-case">(selección múltiple)</span>
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed border-bg-border bg-bg cursor-pointer hover:border-electric transition-colors overflow-hidden"
                  >
                    {previews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {previews.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <div key={i} className="aspect-square rounded-lg overflow-hidden border border-bg-border">
                            <img src={src} alt="" className="w-full h-full object-contain bg-bg" />
                          </div>
                        ))}
                        <div className="aspect-square rounded-lg border border-dashed border-bg-border flex items-center justify-center">
                          <Plus className="w-4 h-4 text-fg-muted" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Upload className="w-7 h-7 text-fg-muted" />
                        <p className="text-xs text-fg-muted text-center px-4">
                          Tap para subir fotos<br />
                          <span className="text-electric">Múltiples desde carrete</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                  {files.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-electric">
                      {files.length} imagen{files.length > 1 ? 'es' : ''} seleccionada{files.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Nombre</label>
                  <input required value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="kaizen-input" placeholder='Ej: "Essentials Black"' />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Descripción</label>
                  <textarea value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    rows={3} className="kaizen-input resize-none"
                    placeholder="Materiales, ajuste, detalles de construcción..." />
                </div>

                {/* Precio + Categoría + Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Precio MXN</label>
                    <input required inputMode="decimal" value={form.precio}
                      onChange={e => setForm({ ...form, precio: e.target.value })}
                      className="kaizen-input" placeholder="599" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Stock</label>
                    <input required inputMode="numeric" value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      className="kaizen-input" placeholder="1" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Categoría</label>
                  <select value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="kaizen-input">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="sticky bottom-0 bg-bg-card/95 backdrop-blur p-4 border-t border-bg-border">
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold disabled:opacity-60 active:scale-[0.98] transition-all">
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Check className="w-4 h-4" />{editing ? 'Guardar cambios' : 'Crear producto'}</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
