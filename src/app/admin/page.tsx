'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, LogOut, Upload, Loader2, Check, X, Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Producto } from '@/types';

const CATEGORIAS = ['Hype', 'Classic', 'Signature', 'Limited'] as const;

interface FormState {
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
  disponible: boolean;
  imagen_url: string;
}
const emptyForm: FormState = {
  nombre: '', descripcion: '', precio: '', categoria: 'Hype', disponible: true, imagen_url: '',
};

export default function AdminPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kaizen_productos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProductos((data ?? []) as Producto[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          router.replace('/admin/login');
        } else {
          setAuthChecked(true);
        }
      } catch {
        router.replace('/admin/login');
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    if (authChecked) fetchProductos();
  }, [authChecked, fetchProductos]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setPreview(null);
    setFile(null);
    setShowForm(true);
  };

  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      categoria: p.categoria,
      disponible: p.disponible,
      imagen_url: p.imagen_url ?? '',
    });
    setPreview(p.imagen_url);
    setFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setPreview(null);
    setFile(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const uploadImage = async (supabase: ReturnType<typeof createClient>): Promise<string | null> => {
    if (!file) return form.imagen_url || null;
    const ext = file.name.split('.').pop();
    const filename = `kaizen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('imagenes').upload(filename, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });
    if (error) { alert('Error subiendo imagen: ' + error.message); return null; }
    const { data } = supabase.storage.from('imagenes').getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const imagen_url = await uploadImage(supabase);
      if (file && !imagen_url) { setSaving(false); return; }
      const precio = parseFloat(form.precio);
      if (isNaN(precio)) { alert('Precio inválido'); setSaving(false); return; }

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        categoria: form.categoria,
        disponible: form.disponible,
        imagen_url: imagen_url ?? null,
      };

      const { error } = editing
        ? await supabase.from('kaizen_productos').update(payload).eq('id', editing.id)
        : await supabase.from('kaizen_productos').insert(payload);

      if (error) { alert('Error guardando: ' + error.message); setSaving(false); return; }

      setSaving(false);
      closeForm();
      fetchProductos();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
      setSaving(false);
    }
  };

  const handleDelete = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('kaizen_productos').delete().eq('id', p.id);
    if (error) alert(error.message); else fetchProductos();
  };

  const toggleDisponible = async (p: Producto) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('kaizen_productos')
      .update({ disponible: !p.disponible })
      .eq('id', p.id);
    if (error) alert(error.message); else fetchProductos();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (!authChecked) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-electric" />
      </main>
    );
  }

  return (
    <main className="bg-glow min-h-dvh pb-32">
      <header className="sticky top-0 z-30 px-5 md:px-8 py-4 backdrop-blur-lg bg-bg/70 border-b border-bg-border/40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest text-fg-muted uppercase">KΛIZEN CΛPS</p>
            <h1 className="brand-mark text-lg md:text-xl">Admin</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-fg-muted hover:text-electric transition-colors">
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 md:px-8 pt-5">
        <button
          onClick={openNew}
          className="w-full md:w-auto md:px-8 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-electric text-white font-semibold tracking-wide active:scale-[0.98] transition-all hover:shadow-[0_0_30px_rgba(0,71,255,0.5)]"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>

        <div className="mt-6 mb-3 flex items-baseline justify-between">
          <h2 className="brand-mark text-sm md:text-base tracking-widest">INVENTARIO</h2>
          <span className="text-xs text-fg-muted">{productos.length} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-electric" />
          </div>
        ) : productos.length === 0 ? (
          <p className="text-center text-sm text-fg-muted py-10">
            Aún no hay productos. Crea el primer drop.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productos.map((p) => (
              <motion.div key={p.id} layout className="glass rounded-2xl p-3 flex gap-3">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-bg flex items-center justify-center flex-shrink-0 overflow-hidden border border-bg-border">
                  {p.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-fg-muted" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="brand-mark text-sm truncate">{p.nombre}</p>
                      <p className="text-xs text-electric font-semibold">${p.precio.toFixed(2)} MXN</p>
                      <p className="text-[10px] text-fg-muted mt-0.5">{p.categoria}</p>
                    </div>
                    <button
                      onClick={() => toggleDisponible(p)}
                      className={`px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase border transition-colors ${
                        p.disponible ? 'border-electric text-electric' : 'border-bg-border text-fg-muted'
                      }`}
                    >
                      {p.disponible ? 'Live' : 'Off'}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-fg-muted hover:text-electric transition-colors">
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button onClick={() => handleDelete(p)} className="flex items-center gap-1 text-xs text-fg-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" /> Borrar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ backgroundColor: 'rgba(10,10,12,0)' }}
            animate={{ backgroundColor: 'rgba(10,10,12,0.85)' }}
            exit={{ backgroundColor: 'rgba(10,10,12,0)' }}
            onClick={closeForm}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
          >
            <motion.form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="glass w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[92dvh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-bg-card/90 backdrop-blur px-5 py-4 border-b border-bg-border flex items-center justify-between z-10">
                <h2 className="brand-mark text-base">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button type="button" onClick={closeForm} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center border border-bg-border">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-2">
                    Imagen (PNG sin fondo recomendado)
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative aspect-square rounded-2xl border-2 border-dashed border-bg-border bg-bg flex items-center justify-center overflow-hidden cursor-pointer hover:border-electric transition-colors"
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="preview" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-fg-muted" />
                        <p className="text-xs text-fg-muted">Tap para subir imagen</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </div>

                <Field label="Nombre">
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="kaizen-input"
                    placeholder='Ej: "Essentials Black"'
                  />
                </Field>

                <Field label="Descripción técnica">
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={4}
                    className="kaizen-input resize-none"
                    placeholder="Tela, bordado, ajuste, detalles..."
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Precio MXN">
                    <input
                      required
                      inputMode="decimal"
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      className="kaizen-input"
                      placeholder="599"
                    />
                  </Field>
                  <Field label="Categoría">
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className="kaizen-input"
                    >
                      {CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </Field>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-bg border border-bg-border">
                  <div>
                    <p className="text-sm">Disponible en tienda</p>
                    <p className="text-[10px] text-fg-muted">Visible en la boutique pública</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, disponible: !form.disponible })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.disponible ? 'bg-electric' : 'bg-bg-border'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.disponible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>

              <div className="sticky bottom-0 bg-bg-card/90 backdrop-blur p-4 border-t border-bg-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-electric text-white font-semibold disabled:opacity-60 active:scale-[0.98] transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Check className="w-4 h-4" />{editing ? 'Guardar cambios' : 'Crear producto'}</>)}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">{label}</label>
      {children}
    </div>
  );
}
