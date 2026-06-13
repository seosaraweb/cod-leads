import React, { useState, useEffect, useRef } from 'react';
import api, { getImageUrl } from '../utils/api';

const emptySize = () => ({ label: '', price: '' });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', base_price:'', sizes:[] });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const load = () => api.get('/products/all').then(r => setProducts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name:'', description:'', base_price:'', sizes:[] });
    setImageFile(null); setImagePreview(null);
    setError(''); setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ name:p.name, description:p.description||'', base_price:p.base_price||'', sizes: p.sizes||[] });
    setImageFile(null);
    setImagePreview(p.image ? getImageUrl(p.image) : null);
    setError(''); setShowForm(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addSize = () => setForm(f => ({ ...f, sizes: [...f.sizes, emptySize()] }));
  const removeSize = (i) => setForm(f => ({ ...f, sizes: f.sizes.filter((_,idx) => idx !== i) }));
  const updateSize = (i, key, val) => setForm(f => ({
    ...f, sizes: f.sizes.map((s, idx) => idx === i ? { ...s, [key]: val } : s)
  }));

  const save = async () => {
    if (!form.name) return setError('Nom requis');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('base_price', form.base_price || 0);
      fd.append('sizes', JSON.stringify(form.sizes.filter(s => s.label)));
      fd.append('active', '1');
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await api.put(`/products/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowForm(false);
      load();
    } catch(err) { setError(err.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const toggle = async (p) => {
    const fd = new FormData();
    fd.append('name', p.name);
    fd.append('description', p.description||'');
    fd.append('base_price', p.base_price||0);
    fd.append('sizes', JSON.stringify(p.sizes||[]));
    fd.append('active', p.active ? '0' : '1');
    await api.put(`/products/${p.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
  };

  const inp = { padding:'13px 14px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:16, outline:'none', width:'100%', boxSizing:'border-box', background:'#fff' };

  if (showForm) return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => setShowForm(false)} style={{ width:40,height:40,borderRadius:12,border:'2px solid #e5e7eb',background:'#fff',fontSize:20,cursor:'pointer' }}>←</button>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{editing ? 'Modifier produit' : 'Nouveau produit'}</h2>
      </div>

      {/* Image upload */}
      <div style={{ marginBottom:16 }}>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} style={{ display:'none' }} />
        <div onClick={() => fileRef.current.click()}
          style={{ width:'100%', aspectRatio:'16/9', background:'#f5f5f5', borderRadius:16, border:'2px dashed #d1d5db', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}>
          {imagePreview ? (
            <img src={imagePreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ textAlign:'center', color:'#aaa' }}>
              <div style={{ fontSize:40 }}>📸</div>
              <div style={{ fontSize:14, marginTop:8 }}>Appuie pour ajouter une photo</div>
            </div>
          )}
          {imagePreview && (
            <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,0.5)', color:'#fff', borderRadius:8, padding:'6px 12px', fontSize:13 }}>Changer</div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
        <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Nom du produit *" style={inp} />
        <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Description (optionnel)" style={inp} />
        <div style={{ position:'relative' }}>
          <input value={form.base_price} onChange={e => setForm(f=>({...f,base_price:e.target.value}))} placeholder="Prix de base (DH)" type="number" style={inp} />
          <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:14 }}>DH</span>
        </div>
      </div>

      {/* Sizes */}
      <div style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Tailles</div>
          <button onClick={addSize} style={{ padding:'8px 16px', background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>+ Ajouter</button>
        </div>
        {form.sizes.length === 0 && (
          <div style={{ color:'#bbb', fontSize:14, textAlign:'center', padding:'12px 0' }}>Pas de tailles → prix unique</div>
        )}
        {form.sizes.map((s, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 100px 40px', gap:8, marginBottom:8 }}>
            <input value={s.label} onChange={e => updateSize(i,'label',e.target.value)} placeholder="Ex: M, L, 42..." style={{ ...inp, padding:'11px 12px', fontSize:15 }} />
            <input value={s.price} onChange={e => updateSize(i,'price',e.target.value)} placeholder="Prix DH" type="number" style={{ ...inp, padding:'11px 12px', fontSize:15 }} />
            <button onClick={() => removeSize(i)} style={{ background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:10, fontSize:18, cursor:'pointer' }}>×</button>
          </div>
        ))}
      </div>

      {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'12px', borderRadius:12, marginBottom:12, fontSize:14 }}>{error}</div>}

      <button onClick={save} disabled={loading}
        style={{ width:'100%', padding:'16px', background: loading ? '#93c5fd' : '#2563eb', color:'#fff', border:'none', borderRadius:14, fontSize:17, fontWeight:700, cursor:'pointer' }}>
        {loading ? 'Sauvegarde...' : editing ? '💾 Enregistrer' : '✅ Créer le produit'}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📦 Produits ({products.length})</h2>
        <button onClick={openAdd} style={{ padding:'10px 18px', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:15 }}>+ Nouveau</button>
      </div>

      {products.length === 0 && (
        <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>
          <div style={{ fontSize:48 }}>📦</div>
          <div style={{ marginTop:12, fontWeight:600 }}>Aucun produit</div>
          <button onClick={openAdd} style={{ marginTop:16, padding:'12px 24px', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:16 }}>Créer le premier</button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {products.map(p => (
          <div key={p.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden', display:'flex', alignItems:'center', gap:0, opacity: p.active ? 1 : 0.5 }}>
            <div style={{ width:72, height:72, flexShrink:0, background:'#f0f0f0', overflow:'hidden' }}>
              {p.image ? <img src={getImageUrl(p.image)} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📦</div>}
            </div>
            <div style={{ flex:1, padding:'10px 12px', minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
              {p.sizes?.length > 0 ? (
                <div style={{ fontSize:12, color:'#2563eb', marginTop:2 }}>{p.sizes.map(s=>`${s.label} ${s.price}DH`).join(' · ')}</div>
              ) : (
                <div style={{ fontSize:14, fontWeight:700, color:'#059669', marginTop:2 }}>{p.base_price} DH</div>
              )}
              <div style={{ display:'inline-block', background: p.active ? '#d1fae5' : '#f3f4f6', color: p.active ? '#065f46' : '#888', fontSize:11, padding:'2px 8px', borderRadius:99, marginTop:4, fontWeight:600 }}>
                {p.active ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'10px 10px 10px 0' }}>
              <button onClick={() => openEdit(p)} style={{ padding:'7px 14px', background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:9, fontWeight:600, cursor:'pointer', fontSize:13 }}>✏️</button>
              <button onClick={() => toggle(p)} style={{ padding:'7px 14px', background: p.active ? '#fff7ed' : '#f0fdf4', color: p.active ? '#ea580c' : '#16a34a', border:'none', borderRadius:9, fontWeight:600, cursor:'pointer', fontSize:13 }}>
                {p.active ? '⏸' : '▶️'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
