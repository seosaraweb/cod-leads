import React, { useState, useEffect, useRef } from 'react';
import api, { getImageUrl } from '../utils/api';

/* ─── helpers ─── */
const imgUrl = (filename) => filename ? getImageUrl(`/uploads/${filename}`) : null;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('list'); // list | edit
  const [current, setCurrent] = useState(null); // product being edited

  const load = async () => {
    const res = await api.get('/products/all');
    setProducts(res.data);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setCurrent(null); setView('edit'); };
  const openEdit = (p) => { setCurrent(p); setView('edit'); };
  const back = () => { setView('list'); setCurrent(null); load(); };

  const toggleActive = async (p) => {
    await api.put(`/products/${p.id}`, { name: p.name, description: p.description, base_price: p.base_price, active: !p.active });
    load();
  };

  if (view === 'edit') return <ProductEditor product={current} onBack={back} />;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>📦 Produits</h1>
        <button onClick={openNew} style={{ padding:'11px 22px', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer' }}>+ Nouveau</button>
      </div>

      {products.length === 0 && (
        <div style={{ textAlign:'center', padding:80, background:'#fff', borderRadius:16, color:'#aaa' }}>
          <div style={{ fontSize:56 }}>📦</div>
          <div style={{ marginTop:12, fontWeight:600, fontSize:16 }}>Aucun produit encore</div>
          <button onClick={openNew} style={{ marginTop:16, padding:'12px 28px', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:15 }}>Créer le premier produit</button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {products.map(p => {
          const firstImg = p.images?.[0];
          return (
            <div key={p.id} style={{ background:'#fff', borderRadius:14, display:'flex', alignItems:'center', gap:0, overflow:'hidden', opacity: p.active ? 1 : 0.55 }}>
              {/* Thumbnail */}
              <div style={{ width:80, height:80, flexShrink:0, background:'#f0f0f0', overflow:'hidden' }}>
                {firstImg
                  ? <img src={imgUrl(firstImg.filename)} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📦</div>
                }
              </div>

              {/* Info */}
              <div style={{ flex:1, padding:'12px 14px', minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:16 }}>{p.name}</div>
                <div style={{ fontSize:13, color:'#888', marginTop:2 }}>
                  {p.images?.length || 0} photo{(p.images?.length||0)!==1?'s':''} ·{' '}
                  {p.variants?.length > 0 ? `${p.variants.length} variante${p.variants.length>1?'s':''}` : `${p.base_price} DH`}
                </div>
                {p.variants?.length > 0 && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                    {p.variants.slice(0,6).map((v,i) => (
                      <span key={i} style={{ background:'#f0f0f0', fontSize:11, padding:'2px 8px', borderRadius:99, color:'#555' }}>
                        {[v.size, v.color].filter(Boolean).join(' / ') || '—'} · {v.price} DH
                      </span>
                    ))}
                    {p.variants.length > 6 && <span style={{ fontSize:11, color:'#aaa' }}>+{p.variants.length-6}</span>}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'10px 10px 10px 0', flexShrink:0 }}>
                <button onClick={() => openEdit(p)} style={{ padding:'7px 14px', background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:9, fontWeight:600, cursor:'pointer', fontSize:13 }}>✏️ Modifier</button>
                <button onClick={() => toggleActive(p)} style={{ padding:'7px 14px', background: p.active?'#fff7ed':'#f0fdf4', color: p.active?'#ea580c':'#16a34a', border:'none', borderRadius:9, fontWeight:600, cursor:'pointer', fontSize:13 }}>
                  {p.active ? '⏸ Pause' : '▶ Activer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PRODUCT EDITOR
════════════════════════════════════════ */
function ProductEditor({ product, onBack }) {
  const isNew = !product;
  const [info, setInfo] = useState({ name: product?.name||'', description: product?.description||'', base_price: product?.base_price||'' });
  const [images, setImages] = useState(product?.images || []);
  const [variants, setVariants] = useState(product?.variants || []);
  const [productId, setProductId] = useState(product?.id || null);
  const [saved, setSaved] = useState(!isNew); // if editing, info already saved
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  /* Save basic info first */
  const saveInfo = async () => {
    if (!info.name) return setError('Nom requis');
    setSaving(true); setError('');
    try {
      let res;
      if (productId) {
        res = await api.put(`/products/${productId}`, { ...info, active: true });
      } else {
        res = await api.post('/products', info);
        setProductId(res.data.id);
        setImages(res.data.images || []);
        setVariants(res.data.variants || []);
      }
      setSaved(true);
    } catch(e) { setError(e.response?.data?.error || 'Erreur'); }
    setSaving(false);
  };

  /* Upload images */
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    try {
      const res = await api.post(`/products/${productId}/images`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setImages(prev => [...prev, ...res.data]);
    } catch(e) { setError('Erreur upload'); }
    setUploading(false);
    e.target.value = '';
  };

  const deleteImage = async (imgId) => {
    if (!window.confirm('Supprimer cette image ?')) return;
    await api.delete(`/images/${imgId}`);
    setImages(prev => prev.filter(i => i.id !== imgId));
    // remove from variants too
    setVariants(prev => prev.map(v => v.image_id === imgId ? {...v, image_id: null} : v));
  };

  /* Variants */
  const addVariant = () => setVariants(prev => [...prev, { size:'', color:'', price: info.base_price||0, image_id: null, _key: Date.now() }]);
  const removeVariant = (idx) => setVariants(prev => prev.filter((_,i) => i !== idx));
  const updateVariant = (idx, key, val) => setVariants(prev => prev.map((v,i) => i===idx ? {...v,[key]:val} : v));

  const saveVariants = async () => {
    setSaving(true);
    await api.post(`/products/${productId}/variants`, { variants: variants.map(v => ({ size:v.size, color:v.color, price:v.price, image_id:v.image_id||null })) });
    setSaving(false);
    onBack();
  };

  const inp = { padding:'11px 14px', borderRadius:10, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={{ width:42,height:42,borderRadius:12,border:'2px solid #e5e7eb',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
        <h1 style={{ margin:0, fontSize:20, fontWeight:800 }}>{isNew ? 'Nouveau produit' : `Modifier — ${product.name}`}</h1>
      </div>

      {/* Step 1 — Info de base */}
      <section style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',background: saved?'#d1fae5':'#dbeafe',color: saved?'#065f46':'#1e40af',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0 }}>{saved?'✓':'1'}</div>
          <div style={{ fontWeight:700, fontSize:16 }}>Informations de base</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input value={info.name} onChange={e=>setInfo(f=>({...f,name:e.target.value}))} placeholder="Nom du produit *" style={inp} disabled={saved && !isNew} />
          <input value={info.description} onChange={e=>setInfo(f=>({...f,description:e.target.value}))} placeholder="Description (optionnel)" style={inp} />
          <div style={{ position:'relative' }}>
            <input value={info.base_price} onChange={e=>setInfo(f=>({...f,base_price:e.target.value}))} placeholder="Prix de base en DH" type="number" style={inp} />
            <span style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#aaa',fontSize:14 }}>DH</span>
          </div>
        </div>
        {error && <div style={{ background:'#fee2e2',color:'#b91c1c',padding:'10px 14px',borderRadius:10,marginTop:12,fontSize:14 }}>{error}</div>}
        {!saved && (
          <button onClick={saveInfo} disabled={saving} style={{ marginTop:14,width:'100%',padding:'13px',background:'#2563eb',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
            {saving ? 'Sauvegarde...' : 'Continuer →'}
          </button>
        )}
        {saved && (
          <div style={{ marginTop:10,display:'flex',justifyContent:'flex-end' }}>
            <button onClick={()=>setSaved(false)} style={{ padding:'6px 14px',background:'#f5f5f5',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,color:'#666' }}>✏️ Modifier</button>
          </div>
        )}
      </section>

      {saved && (
        <>
          {/* Step 2 — Images */}
          <section style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'#dbeafe',color:'#1e40af',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14 }}>2</div>
                <div style={{ fontWeight:700, fontSize:16 }}>Photos <span style={{ color:'#aaa',fontWeight:400,fontSize:14 }}>({images.length})</span></div>
              </div>
              <button onClick={()=>fileRef.current.click()} disabled={uploading}
                style={{ padding:'9px 18px',background:'#eff6ff',color:'#2563eb',border:'2px solid #dbeafe',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:14 }}>
                {uploading ? '⏳ Upload...' : '+ Ajouter photos'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display:'none' }} />
            </div>

            {images.length === 0 ? (
              <div onClick={()=>fileRef.current.click()} style={{ border:'2px dashed #e5e7eb',borderRadius:14,padding:'40px 20px',textAlign:'center',cursor:'pointer',color:'#aaa' }}>
                <div style={{ fontSize:40 }}>📸</div>
                <div style={{ marginTop:8,fontSize:15 }}>Clique pour ajouter des photos</div>
                <div style={{ fontSize:13,marginTop:4 }}>Toutes les couleurs, tous les angles</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:10 }}>
                {images.map(img => (
                  <div key={img.id} style={{ position:'relative', borderRadius:12, overflow:'hidden', aspectRatio:'1', background:'#f0f0f0' }}>
                    <img src={imgUrl(img.filename)} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                    <button onClick={()=>deleteImage(img.id)}
                      style={{ position:'absolute',top:4,right:4,width:26,height:26,borderRadius:'50%',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>×</button>
                    <div style={{ position:'absolute',bottom:4,left:4,background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:10,padding:'2px 6px',borderRadius:99 }}>#{img.sort_order}</div>
                  </div>
                ))}
                {/* Add more button */}
                <div onClick={()=>fileRef.current.click()} style={{ borderRadius:12,border:'2px dashed #e5e7eb',aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#aaa',flexDirection:'column',gap:4 }}>
                  <div style={{ fontSize:24 }}>+</div>
                  <div style={{ fontSize:11 }}>Ajouter</div>
                </div>
              </div>
            )}
          </section>

          {/* Step 3 — Variants */}
          <section style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'#dbeafe',color:'#1e40af',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14 }}>3</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>Variantes <span style={{ color:'#aaa',fontWeight:400,fontSize:14 }}>({variants.length})</span></div>
                  <div style={{ fontSize:12,color:'#aaa',marginTop:1 }}>Taille, couleur, prix — autant que tu veux</div>
                </div>
              </div>
              <button onClick={addVariant} style={{ padding:'9px 18px',background:'#eff6ff',color:'#2563eb',border:'2px solid #dbeafe',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:14 }}>+ Variante</button>
            </div>

            {variants.length === 0 ? (
              <div style={{ textAlign:'center',padding:'24px',color:'#aaa',background:'#fafafa',borderRadius:12 }}>
                <div style={{ fontSize:14 }}>Pas de variantes = prix unique ({info.base_price||0} DH)</div>
                <button onClick={addVariant} style={{ marginTop:10,padding:'8px 20px',background:'#2563eb',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontWeight:600,fontSize:14 }}>Ajouter des variantes</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 90px 100px 36px', gap:8, marginBottom:8, padding:'0 4px' }}>
                  {['Taille','Couleur','Prix DH','Photo',''].map(h => (
                    <div key={h} style={{ fontSize:12,color:'#aaa',fontWeight:600 }}>{h}</div>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {variants.map((v, idx) => (
                    <div key={v.id||v._key||idx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 90px 100px 36px', gap:8, alignItems:'center' }}>
                      <input value={v.size} onChange={e=>updateVariant(idx,'size',e.target.value)} placeholder="Ex: M, L, 42..."
                        style={{ padding:'9px 10px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:14,outline:'none' }} />
                      <input value={v.color} onChange={e=>updateVariant(idx,'color',e.target.value)} placeholder="Rouge, Bleu..."
                        style={{ padding:'9px 10px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:14,outline:'none' }} />
                      <input value={v.price} onChange={e=>updateVariant(idx,'price',e.target.value)} type="number" placeholder="0"
                        style={{ padding:'9px 10px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:14,outline:'none' }} />
                      {/* Image picker */}
                      <select value={v.image_id||''} onChange={e=>updateVariant(idx,'image_id',e.target.value?Number(e.target.value):null)}
                        style={{ padding:'9px 6px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,background:'#fff',outline:'none' }}>
                        <option value="">Aucune</option>
                        {images.map(img => <option key={img.id} value={img.id}>Photo #{img.sort_order}</option>)}
                      </select>
                      <button onClick={()=>removeVariant(idx)} style={{ width:36,height:36,background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:9,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <button onClick={saveVariants} disabled={saving}
            style={{ width:'100%',padding:'16px',background: saving?'#93c5fd':'#059669',color:'#fff',border:'none',borderRadius:14,fontSize:17,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 12px rgba(5,150,105,0.25)' }}>
            {saving ? 'Sauvegarde...' : '✅ Enregistrer le produit'}
          </button>
        </>
      )}
    </div>
  );
}
