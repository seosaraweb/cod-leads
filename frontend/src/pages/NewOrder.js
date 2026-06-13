import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const CITIES = ['Casablanca','Rabat','Salé','Fès','Marrakech','Agadir','Tanger','Meknès','Oujda','Kenitra','Tétouan','Safi','Mohammédia','Khouribga','Béni Mellal','El Jadida','Nador','Taza','Settat','Berrechid','Khémisset','Inezgane','Ait Melloul','Larache','Ksar El Kebir','Guelmim','Dakhla','Laâyoune','Errachidia','Ouarzazate','Taroudant','Tiznit','Essaouira','Chefchaouen','Al Hoceima','Berkane','Taourirt','Azrou'].sort();
const imgUrl = (filename) => filename ? getImageUrl(`/uploads/${filename}`) : null;
const STEP = { PRODUCT:1, VARIANT:2, CLIENT:3, DONE:4 };

export default function NewOrder() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(STEP.PRODUCT);
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [form, setForm] = useState({ client_name:'', phone:'', address:'', city:'', quantity:1, notes:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/products').then(r => setProducts(r.data)).catch(()=>{}); }, []);

  const pickProduct = (p) => {
    setProduct(p);
    setActiveImage(p.images?.[0] || null);
    setVariant(null);
    if (p.variants?.length > 0) setStep(STEP.VARIANT);
    else { setVariant(null); setStep(STEP.CLIENT); }
  };

  const pickVariant = (v) => {
    setVariant(v);
    // Show variant's image if linked
    if (v.image_id) {
      const img = product.images?.find(i => i.id === v.image_id);
      if (img) setActiveImage(img);
    }
    setStep(STEP.CLIENT);
  };

  const getPrice = () => variant?.price || product?.base_price || 0;
  const getVariantLabel = () => variant ? [variant.size, variant.color].filter(Boolean).join(' / ') : '';

  const confirm = async () => {
    if (!form.client_name || !form.phone || !form.address || !form.city)
      return setError('Remplis tous les champs obligatoires');
    setLoading(true); setError('');
    try {
      const imageFilename = activeImage?.filename || product.images?.[0]?.filename || '';
      const res = await api.post('/orders', {
        product_id: product.id,
        product_name: product.name,
        product_image: imageFilename,
        variant_id: variant?.id || null,
        variant_label: getVariantLabel(),
        price: getPrice(),
        ...form
      });
      setSuccess(res.data);
      setStep(STEP.DONE);
    } catch(e) { setError(e.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const reset = () => {
    setStep(STEP.PRODUCT); setProduct(null); setVariant(null); setActiveImage(null);
    setForm({ client_name:'', phone:'', address:'', city:'', quantity:1, notes:'' });
    setSuccess(null); setError('');
  };

  const inp = { padding:'12px 14px', borderRadius:10, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

  /* ── DONE ── */
  if (step === STEP.DONE && success) return (
    <div style={{ maxWidth:520, margin:'0 auto' }}>
      <div style={{ textAlign:'center', padding:'36px 0 24px' }}>
        <div style={{ fontSize:72 }}>✅</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#065f46', marginTop:12 }}>Commande confirmée !</div>
        <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:'#2563eb', marginTop:10, background:'#eff6ff', display:'inline-block', padding:'8px 24px', borderRadius:99 }}>{success.order_ref}</div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, padding:'20px', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['👤',success.client_name],['📱',success.phone],['📦',success.product_name+(success.variant_label?` — ${success.variant_label}`:'')],['📍',success.city],['💰',`${success.price * success.quantity} DH`],['👨‍💼',success.support_name]].map(([icon,val],i)=>(
            <div key={i} style={{ background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
              <div style={{ fontWeight:700, fontSize:14 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:2 }}>📍 Adresse</div>
          <div style={{ fontWeight:600 }}>{success.address}, {success.city}</div>
        </div>
      </div>
      <button onClick={reset} style={{ width:'100%', padding:'16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:14, fontSize:18, fontWeight:700, cursor:'pointer' }}>➕ Nouvelle commande</button>
    </div>
  );

  /* ── STEP 1 : PRODUCT GRID ── */
  if (step === STEP.PRODUCT) return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>Nouvelle commande</h1>
        <p style={{ margin:'4px 0 0', color:'#888', fontSize:14 }}>Bonjour {user?.username} — choisis le produit</p>
      </div>
      {products.length === 0 && (
        <div style={{ textAlign:'center', padding:80, background:'#fff', borderRadius:16, color:'#aaa' }}>
          <div style={{ fontSize:56 }}>📦</div>
          <div style={{ marginTop:12, fontWeight:600 }}>Aucun produit actif</div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:14 }}>
        {products.map(p => {
          const img = p.images?.[0];
          return (
            <button key={p.id} onClick={() => pickProduct(p)}
              style={{ background:'#fff', border:'2px solid #e5e7eb', borderRadius:16, padding:0, cursor:'pointer', textAlign:'left', overflow:'hidden' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.transform='none';}}>
              <div style={{ width:'100%', aspectRatio:'1', background:'#f0f0f0', overflow:'hidden' }}>
                {img ? <img src={imgUrl(img.filename)} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                     : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>📦</div>}
              </div>
              <div style={{ padding:'10px 12px 12px' }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#111' }}>{p.name}</div>
                {p.variants?.length > 0
                  ? <div style={{ fontSize:12, color:'#2563eb', marginTop:4, fontWeight:600 }}>{p.variants.length} variante{p.variants.length>1?'s':''}</div>
                  : <div style={{ fontSize:15, fontWeight:800, color:'#059669', marginTop:4 }}>{p.base_price} DH</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── STEP 2 : VARIANT PICKER ── */
  if (step === STEP.VARIANT) return (
    <div>
      {/* Back + product name */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={()=>setStep(STEP.PRODUCT)} style={{ width:42,height:42,borderRadius:12,border:'2px solid #e5e7eb',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{product.name}</h2>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Image gallery */}
        <div>
          {/* Main image */}
          <div style={{ borderRadius:16, overflow:'hidden', background:'#f0f0f0', aspectRatio:'1', marginBottom:10 }}>
            {activeImage
              ? <img src={imgUrl(activeImage.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>📦</div>}
          </div>
          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {product.images.map(img => (
                <div key={img.id} onClick={() => setActiveImage(img)}
                  style={{ width:60, height:60, borderRadius:10, overflow:'hidden', cursor:'pointer', border: activeImage?.id===img.id ? '2px solid #2563eb' : '2px solid transparent', flexShrink:0 }}>
                  <img src={imgUrl(img.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants */}
        <div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12, color:'#555' }}>Choisir la variante</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:420, overflowY:'auto' }}>
            {product.variants.map((v, idx) => {
              const varImg = v.image_id ? product.images?.find(i => i.id === v.image_id) : null;
              const label = [v.size, v.color].filter(Boolean).join(' / ') || `Variante ${idx+1}`;
              return (
                <button key={v.id||idx} onClick={() => pickVariant(v)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'#fff', border:'2px solid #e5e7eb', borderRadius:12, cursor:'pointer', textAlign:'left', transition:'all 0.12s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.background='#eff6ff';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#fff';}}>
                  {varImg && (
                    <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                      <img src={imgUrl(varImg.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{label}</div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#059669', flexShrink:0 }}>{v.price} DH</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── STEP 3 : CLIENT FORM ── */
  return (
    <div>
      {/* Header recap */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
        <button onClick={() => setStep(product?.variants?.length > 0 ? STEP.VARIANT : STEP.PRODUCT)}
          style={{ width:42,height:42,borderRadius:12,border:'2px solid #e5e7eb',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>←</button>
        {activeImage
          ? <img src={imgUrl(activeImage.filename)} alt="" style={{ width:56,height:56,borderRadius:12,objectFit:'cover',flexShrink:0 }} />
          : <div style={{ width:56,height:56,background:'#f0f0f0',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0 }}>📦</div>}
        <div>
          <div style={{ fontWeight:800, fontSize:17 }}>{product?.name}</div>
          {variant && <div style={{ fontSize:13, color:'#2563eb', fontWeight:600 }}>{getVariantLabel()}</div>}
          <div style={{ fontSize:15, fontWeight:800, color:'#059669' }}>{getPrice()} DH</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#666', marginBottom:2 }}>👤 Infos client</div>
            <input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} placeholder="Nom complet *" style={inp} />
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Téléphone *" type="tel" style={inp} />
          </div>
          <div style={{ background:'#fff', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#666', marginBottom:2 }}>🚚 Livraison</div>
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Adresse complète *" style={inp} />
            <select value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} style={{ ...inp, background:'#fff', color: form.city?'#111':'#999' }}>
              <option value="">-- Ville * --</option>
              {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes spéciales..." style={inp} />
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'16px' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#666', marginBottom:12 }}>📦 Quantité</div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <button onClick={()=>setForm(f=>({...f,quantity:Math.max(1,f.quantity-1)}))} style={{ width:44,height:44,borderRadius:12,border:'2px solid #e5e7eb',background:'#f9f9f9',fontSize:22,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
              <span style={{ fontSize:28, fontWeight:800, flex:1, textAlign:'center' }}>{form.quantity}</span>
              <button onClick={()=>setForm(f=>({...f,quantity:f.quantity+1}))} style={{ width:44,height:44,borderRadius:12,border:'2px solid #e5e7eb',background:'#f9f9f9',fontSize:22,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
            <div style={{ textAlign:'center', fontSize:28, fontWeight:900, color:'#059669', marginTop:16 }}>{getPrice()*form.quantity} DH</div>
          </div>
        </div>
      </div>

      {error && <div style={{ background:'#fee2e2',color:'#b91c1c',padding:'12px 16px',borderRadius:12,marginTop:14,fontSize:14,fontWeight:500 }}>{error}</div>}

      <button onClick={confirm} disabled={loading}
        style={{ width:'100%',marginTop:16,padding:'18px',background: loading?'#93c5fd':'#2563eb',color:'#fff',border:'none',borderRadius:16,fontSize:18,fontWeight:800,cursor: loading?'wait':'pointer',boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
        {loading ? '⏳ Confirmation...' : `✅ Confirmer — ${getPrice()*form.quantity} DH`}
      </button>
    </div>
  );
}
