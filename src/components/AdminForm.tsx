'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Plus, Loader2, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Producto } from '@/types';

const CATEGORIAS = ['KΛIZEN Essentials', 'Hype Selection', 'The Vault'] as const;

interface FormState {
  nombre: string;
  descripcion: string;
  precio: string;
  precio_oferta: string;
  en_promocion: boolean;
  categoria: string;
  stock: string;
  existingImages: string[];
}

function emptyForm(): FormState {
  return {
    nombre: '', descripcion: '', precio: '', precio_oferta: '',
    en_promocion: false, categoria: 'KΛIZEN Essentials', stock: '1', existingImages: [],
  };
}

function fromProducto(p: Producto): FormState {
  const imgs = p.imagenes?.length ? p.imagenes : p.imagen_url ? [p.imagen_url] : [];
  return {
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    precio: String(p.precio),
    precio_oferta: p.precio_oferta ? String(p.precio_oferta) : '',
    en_promocion: p.en_promocion,
    categoria: p.categoria,
    stock: String(p.stock),
    existingImages: imgs,
  };
}

interface AdminFormProps {
  editing: Producto | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function AdminForm({ editing, onSuccess, onClose }: AdminFormProps) {
  const [form, setForm] = useState<FormState>(editing ? fromProducto(editing) : emptyForm());
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(editing ? fromProducto(editing).existingImages : []);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const f = (patch: Partial<FormState>) => setForm(s => ({ ...s, ...patch }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setFiles(selected);
    setPreviews(selected.map(fl => URL.createObjectURL(fl)));
  };

  const uploadImages = async (sb: ReturnType<typeof createClient>): Promise<string[]> => {
    if (!files.length) return form.existingImages;
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const name = `kaizen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from('imagenes').upload(name, file, {
        cacheControl: '3600', upsert: false, contentType: file.type,
      });
      if (error) { alert('Error subiendo imagen: ' + error.message); continue; }
      urls.push(sb.storage.from('imagenes').getPublicUrl(name).data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock, 10);
    if (isNaN(precio) || isNaN(stock)) { alert('Precio o stock inválido'); return; }
    const precio_oferta = form.en_promocion && form.precio_oferta ? parseFloat(form.precio_oferta) : null;

    setSaving(true);
    try {
      const sb = createClient();
      const imagenes = await uploadImages(sb);
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        precio_oferta,
        en_promocion: form.en_promocion,
        categoria: form.categoria,
        stock,
        imagenes,
        imagen_url: imagenes[0] ?? null,
      };
      const { error } = editing
        ? await sb.from('kaizen_productos').update(payload).eq('id', editing.id)
        : await sb.from('kaizen_productos').insert(payload);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
      onSuccess();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
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
        {/* Header */}
        <div className="sticky top-0 bg-bg-card/95 backdrop-blur px-5 py-4 border-b border-bg-border flex items-center justify-between z-10">
          <h2 className="brand-mark text-base">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg border border-bg-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Multi-image */}
          <div>
            <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-2">
              Imágenes <span className="text-electric normal-case">(múltiples desde carrete)</span>
            </label>
            <div onClick={() => fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-bg-border bg-bg cursor-pointer hover:border-electric transition-colors overflow-hidden">
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
                    Tap para subir<br /><span className="text-electric">Múltiples fotos</span>
                  </p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            {files.length > 0 && (
              <p className="mt-1.5 text-[10px] text-electric">
                {files.length} imagen{files.length > 1 ? 'es' : ''} lista{files.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Nombre</label>
            <input required value={form.nombre} onChange={e => f({ nombre: e.target.value })}
              className="kaizen-input" placeholder='Ej: "Essentials Black"' />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={e => f({ descripcion: e.target.value })}
              rows={3} className="kaizen-input resize-none"
              placeholder="Materiales, ajuste, detalles de construcción..." />
          </div>

          {/* Precio + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Precio MXN</label>
              <input required inputMode="decimal" value={form.precio}
                onChange={e => f({ precio: e.target.value })}
                className="kaizen-input" placeholder="599" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-fg-muted uppercase mb-1.5">Stock</label>
              <input required inputMode="numeric" value={form.stock}
                onChange={e => f({ stock: e.target.value })}
                className="kaizen-input" placeholder="1" />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[10px] tracking-widests text-fg-muted uppercase mb-1.5">Categoría</label>
            <select value={form.categoria} onChange={e => f({ categoria: e.target.value })} className="kaizen-input">
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Promoción switch */}
          <div className="glass rounded-2xl p-4 border border-bg-border space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Activar Promoción</p>
                <p className="text-[10px] text-fg-muted">Muestra precio tachado + badge PROMO</p>
              </div>
              <button type="button"
                onClick={() => f({ en_promocion: !form.en_promocion })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.en_promocion ? 'bg-electric' : 'bg-bg-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.en_promocion ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>

            {/* Precio oferta — visible solo si promo activa */}
            {form.en_promocion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label className="block text-[10px] tracking-widests text-electric uppercase mb-1.5">
                  Precio de Oferta MXN
                </label>
                <input
                  inputMode="decimal"
                  value={form.precio_oferta}
                  onChange={e => f({ precio_oferta: e.target.value })}
                  className="kaizen-input border-electric/50 focus:border-electric"
                  placeholder="449"
                />
                {form.precio && form.precio_oferta && (
                  <p className="mt-1.5 text-[10px] text-electric">
                    Descuento:{' '}
                    {Math.round((1 - parseFloat(form.precio_oferta) / parseFloat(form.precio)) * 100)}% OFF
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 bg-bg-card/95 backdrop-blur p-4 border-t border-bg-border">
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-electric text-white font-semibold disabled:opacity-60 active:scale-[0.98] transition-all hover:shadow-[0_0_30px_rgba(0,71,255,.5)]">
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Check className="w-4 h-4" />{editing ? 'Guardar cambios' : 'Crear producto'}</>}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
