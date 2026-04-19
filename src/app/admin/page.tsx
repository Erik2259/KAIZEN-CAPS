'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, LogOut, Upload, Loader2, Check, X, Image as ImageIcon, Package, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Producto } from '@/types';

const CATEGORIAS = ['Hype', 'Classic', 'Signature', 'Limited'] as const;
type Tab = 'inventario' | 'cuenta';

interface FormState {
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
  disponible: boolean;
  existingImages: string[];
}
const emptyForm: FormState = { nombre: '', descripcion: '', precio: '', categoria: 'Hype', disponible: true, existingImages: [] };

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tab, setTab] = useState<Tab>('inventario');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
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
      const { data, error } = await sb.from('kaizen_productos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProductos((data ?? []) as Producto[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const sb = createClient();
        const { data } = await sb.auth.getUser();
        if (!data.user) { router.replace('/admin/login'); return; }
        setUserEmail(data.user.email ?? '');
        setAuthChecked(true);
      } catch { router.replace('/admin/login'); }
    };
    check();
  }, [router]);

  useEffect(() => { if (authChecked) fetchProductos(); }, [authChecked, fetchProductos]);

  const openNew = () => {
    setEditing(null); setForm(emptyForm); setFiles([]); setPreviews([]); setShowForm(true);
  };

  const openEdit = (p: Producto) => {
    const imgs = (p.imagenes && p.imagenes.length > 0) ? p.imagenes : (p.imagen_url ? [p.imagen_url] : []);
    setEditing(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', precio: String(p.precio), categoria: p.categoria, disponible: p.disponible, existingImages: imgs });
    setFiles([]); setPreviews(imgs); setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setFiles([]); setPreviews([]); };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setFiles(selected);
    const urls = selected.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const uploadImages = async (sb: ReturnType<typeof createClient>): Promise<string[]> => {
    if (files.length === 0) return form.existingImages;
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const filename = `kaizen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from('imagenes').upload(filename, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (error) { alert('Error subiendo: ' + error.message); continue; }
      const { data } = sb.storage.from('imagenes').getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precio = parseFloat(form.precio);
    if (isNaN(precio)) { alert('Precio inválido'); return; }
    setSaving(true);
    try {
      const sb = createClient();
      const imagenes = await uploadImages(sb);
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        categoria: form.categoria,
        disponible: form.disponible,
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

  const toggleDisponible = async (p: Producto) => {
    const sb = createClient();
    await sb.from('kaizen_productos').update({ disponible: !p.disponible }).eq('id', p.id);
    fetchProductos();
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
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-electric text-white text-xs font-semibold tracking-wide active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(0,71,255,.5)]">
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-5">
        {/* Inventario Tab */}
        <AnimatePresence mode="wait">
          {tab === 'inventario' && (
            <motion.div key="inventario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="brand-mark text-sm tracking-widest">INVENTARIO</h2>
                <span className="text-xs text-fg-muted">{productos.length} total</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-electric" /></div>
              ) : productos.length === 0 ? (
                <p className="text-center text-sm text-fg-muted py-16">No hay productos. Toca + Nuevo.</p>
              ) : (
                <div className="space-y-3">
                  {productos.map(p => {
                    const imgs = (p.imagenes?.length ? p.imagenes : p.imagen_url ? [p.imagen_url] : []);
                    return (
                      <motion.div key={p.id} layout className="glass rounded-2xl p-3 flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-xl bg-bg border border-bg-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {imgs[0]
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={imgs[0]} alt={p.nombre} className="w-full h-full object-contain" />
                            : <ImageIcon className="w-5 h-5 text-fg-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="brand-mark text-sm truncate">{p.nombre}</p>
                              <p className="text-xs text-electric font-semibold">${p.precio.toFixed(2)} MXN</p>
                              <p className="text-[10px] text-fg-muted">{p.categoria} {imgs.length > 1 ? `· ${imgs.length} fotos` : ''}</p>
                            </div>
                            <button onClick={() => toggleDisponible(p)}
                              className={`px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase border transition-colors flex-shrink-0 ${p.disponible ? 'border-electric text-electric' : 'border-bg-border text-fg-muted'}`}>
                              {p.disponible ? 'Live' : 'Off'}
                            </button>
                          </div>
                          <div className="mt-2 flex gap-3">
                            <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-fg-muted hover:text-electric transition-colors">
                              <Edit3 className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => handleDelete(p)} className="flex items-center gap-1 text-xs text-fg-muted hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" /> Borrar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'cuenta' && (
            <motion.div key="cuenta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass rounded-3xl p-6 mt-4">
              <div className="flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-electric/10 border border-electric/30 flex items-center justify-center">
                  <User className="w-7 h-7 text-electric" />
                </div>
                <div className="text-center">
                  <p className="brand-mark text-base">Admin</p>
                  <p className="text-xs text-fg-muted mt-1">{userEmail}</p>
                </div>
                <div className="w-full border-t border-bg-border pt-5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-fg-muted">Productos totales</span>
                    <span className="text-electric font-bold">{productos.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-fg-muted">Disponibles</span>
                    <span className="text-electric font-bold">{productos.filter(p => p.disponible).length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-fg-muted">Off / Sin stock</span>
                    <span className="text-fg-muted font-bold">{productos.filter(p => !p.disponible).length}</span>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-bg-border text-sm text-fg-muted hover:text-electric hover:border-electric transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
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
          {/* Centro FAB */}
          <div className="flex items-center justify-center px-4">
            <button onClick={openNew}
              className="w-14 h-14 -mt-7 rounded-full bg-electric flex items-center justify-center shadow-[0_0_30px_rgba(0,71,255,.5)] active:scale-90 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
          <button onClick={() => setTab('cuenta')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] tracking-widest uppercase transition-colors ${tab === 'cuenta' ? 'text-electric' : 'text-fg-muted'}`}>
            <User className="w-5 h-5" />
            Cuenta
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
              {/* Sheet header */}
              <div className="sticky top-0 bg-bg-card/95 backdrop-blur px-5 py-4 border-b border-bg-border flex items-center justify-between z-10">
                <h2 className="brand-mark text-base">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button type="button" onClick={closeForm} className="w-8 h-8 rounded-full bg-bg border border-bg-border flex items-center justify-center active:scale-90">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Multi-image upload */}
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-2">
                    Imágenes <span className="normal-case text-electric">(selecciona varias desde tu carrete)</span>
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
                        <p className="text-xs text-fg-muted text-center px-4">Tap para subir fotos de la gorra<br /><span className="text-electric">Selección múltiple</span></p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                  {files.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-electric tracking-wide">{files.length} imagen{files.length > 1 ? 'es' : ''} seleccionada{files.length > 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Nombre</label>
                  <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="kaizen-input" placeholder='Ej: "Essentials Black"' />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Descripción técnica</label>
                  <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    rows={3} className="kaizen-input resize-none" placeholder="Tela, bordado, ajuste, detalles G5..." />
                </div>

                {/* Precio + Categoría */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Precio MXN</label>
                    <input required inputMode="decimal" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                      className="kaizen-input" placeholder="599" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Categoría</label>
                    <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="kaizen-input">
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Disponible */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-bg border border-bg-border">
                  <div>
                    <p className="text-sm">Disponible en tienda</p>
                    <p className="text-[10px] text-fg-muted">Visible en la boutique pública</p>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, disponible: !form.disponible })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.disponible ? 'bg-electric' : 'bg-bg-border'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.disponible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>

              <div className="sticky bottom-0 bg-bg-card/95 backdrop-blur p-4 border-t border-bg-border">
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold disabled:opacity-60 active:scale-[0.98] transition-all hover:shadow-[0_0_30px_rgba(0,71,255,.5)]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" />{editing ? 'Guardar cambios' : 'Crear producto'}</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
