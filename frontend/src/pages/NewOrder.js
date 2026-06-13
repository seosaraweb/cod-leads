import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const CITIES = ['Casablanca','Rabat','Salé','Fès','Marrakech','Agadir','Tanger','Meknès','Oujda','Kenitra','Tétouan','Safi','Mohammédia','Khouribga','Béni Mellal','El Jadida','Nador','Taza','Settat','Berrechid','Khémisset','Inezgane','Ait Melloul','Larache','Ksar El Kebir','Guelmim','Dakhla','Laâyoune','Errachidia','Ouarzazate','Taroudant','Tiznit','Essaouira','Chefchaouen','Al Hoceima','Berkane','Taourirt','Azrou'].sort();

const STEP = { PRODUCT: 1, CLIENT: 2, DONE: 3 };

export default function NewOrder() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(STEP.PRODUCT);
  const [selected, setSelected] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [form, setForm] = useState({ client_name:'', phone:'', address:'', city:'', quantity:1, notes:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
    loadRecent();
  }, []);

  const loadRecent = () => api.get('/orders').then(r => setRecentOrders(r.data.slice(0,6))).catch(() => {});

  const selectProduct = (p) => {
    setSelected(p);
    setSelectedSize(p.sizes?.length > 0 ? null : 'unique');
    setStep(STEP.CLIENT);
    setError('');
  };

  const getPrice = () => {
    if (!selected) return 0;
    if (selected.sizes?.length > 0) {
      const s = selected.sizes.find(s => s.label === selectedSize);
      return s?.price || selected.base_price || 0;
    }
    return selected.base_price || 0;
  };

  const confirm = async () => {
    if (!form.client_name || !form.phone || !form.address || !form.city) return setError('Remplis tous les champs obligatoires');
    if (selected?.sizes?.length > 0 && !selectedSize) return setError('Choisis une taille');
    setLoading(true); setError('');
    try {
      const res = await api.post('/orders', {
        product_id: selected.id, product_name: selected.name,
        product_image: selected.image, size: selectedSize === 'unique' ? '' : selectedSize,
        price: getPrice(), ...form
      });
      setSuccess(res.data);
      setStep(STEP.DONE);
      loadRecent();
    } catch(err) { setError(err.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const reset = () => {
    setStep(STEP.PRODUCT); setSelected(null); setSelectedSize(null);
    setForm({ client_name:'', phone:'', address:'', city:'', quantity:1, notes:'' });
    setSuccess(null); setError('');
  };

  const inp = { padding:'12px 14px', borderRadius:10, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' };

  // ── DONE ──
  if (step === STEP.DONE && success) return (
    <div>
      <div style={{ textAlign:'center', padding:'40px 0 28px' }}>
        <div style={{ fontSize:72, marginBottom:12 }}>✅</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#065f46' }}>Commande confirmée !</div>
        <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:700, color:'#2563eb', marginTop:10, background:'#eff6ff', display:'inline-block', padding:'8px 24px', borderRadius:99 }}>{success.order_ref}</div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, padding:'24px', marginBottom:20, maxWidth:520, margin:'0 auto 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['👤 Client', success.client_name],['📱 Téléphone', success.phone],['📦 Produit', success.product_name + (success.size ? ` (${success.size})` : '')],['📍 Ville', success.city],['💰 Montant', `${success.price} DH`],['👨‍💼 Support', success.support_name]].map(([l,v]) => (
            <div key={l} style={{ background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:2 }}>{l}</div>
              <div style={{ fontWeight:700, fontSize:15 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:2 }}>📍 Adresse</div>
          <div style={{ fontWeight:600 }}>{success.address}, {success.city}</div>
        </div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto' }}>
        <button onClick={reset} style={{ width:'100%', padding:'16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:14, fontSize:18, fontWeight:700, cursor:'pointer' }}>➕ Nouvelle commande</button>
      </div>
    </div>
  );

  // ── PRODUCT GRID ──
  if (step === STEP.PRODUCT) return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>Nouvelle commande</h1>
          <p style={{ margin:'4px 0 0', color:'#888', fontSize:14 }}>Bonjour {user?.username} — choisis le produit</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:14 }}>
        {products.map(p => (
          <button key={p.id} onClick={() => selectProduct(p)}
            style={{ background:'#fff', border:'2px solid #e5e7eb', borderRadius:16, padding:0, cursor:'pointer', textAlign:'left', overflow:'hidden', transition:'all 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.transform='none'; }}>
            {p.image ? (
              <div style={{ width:'100%', aspectRatio:'1', overflow:'hidden', background:'#f5f5f5' }}>
                <img src={getImageUrl(p.image)} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            ) : (
              <div style={{ width:'100%', aspectRatio:'1', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>📦</div>
            )}
            <div style={{ padding:'10px 12px 12px' }}>
              <div style={{ fontWeight:700, fontSize:15, color:'#111' }}>{p.name}</div>
              {p.sizes?.length > 0 ? (
                <div style={{ fontSize:12, color:'#2563eb', marginTop:4, fontWeight:600 }}>{p.sizes.map(s=>s.label).join(' · ')}</div>
              ) : (
                <div style={{ fontSize:15, fontWeight:800, color:'#059669', marginTop:4 }}>{p.base_price} DH</div>
              )}
            </div>
          </button>
        ))}
        {products.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'#aaa' }}>
            <div style={{ fontSize:48 }}>📦</div>
            <div style={{ marginTop:12, fontWeight:600 }}>Aucun produit actif</div>
            <div style={{ fontSize:14, marginTop:4 }}>L'admin doit ajouter des produits</div>
          </div>
        )}
      </div>

      {/* Recent orders on PC */}
      {recentOrders.length > 0 && (
        <div style={{ marginTop:32 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12, color:'#555' }}>🕐 Dernières confirmations</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10 }}>
            {recentOrders.map(o => (
              <div key={o.id} style={{ background:'#fff', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#2563eb' }}>{o.order_ref}</span>
                  <span style={{ background:'#d1fae5', color:'#065f46', fontSize:11, padding:'2px 8px', borderRadius:99, fontWeight:600 }}>{o.status}</span>
                </div>
                <div style={{ fontWeight:700, fontSize:14 }}>{o.client_name}</div>
                <div style={{ fontSize:12, color:'#888' }}>{o.product_name}{o.size ? ` (${o.size})` : ''} · {o.price} DH</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── CLIENT FORM ──
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <button onClick={() => setStep(STEP.PRODUCT)} style={{ background:'#fff', border:'2px solid #e5e7eb', borderRadius:12, width:42, height:42, fontSize:20, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        {selected?.image ? (
          <img src={getImageUrl(selected.image)} alt={selected.name} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', flexShrink:0 }} />
        ) : (
          <div style={{ width:56, height:56, background:'#f0f0f0', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>📦</div>
        )}
        <div>
          <div style={{ fontWeight:800, fontSize:18 }}>{selected?.name}</div>
          <div style={{ fontSize:15, color:'#2563eb', fontWeight:700 }}>{getPrice()} DH</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Left col */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {selected?.sizes?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:'16px' }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10, color:'#555' }}>Taille *</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {selected.sizes.map(s => (
                  <button key={s.label} onClick={() => setSelectedSize(s.label)}
                    style={{ padding:'10px 20px', borderRadius:10, border: selectedSize===s.label ? '2px solid #2563eb' : '2px solid #e5e7eb', background: selectedSize===s.label ? '#eff6ff' : '#fff', color: selectedSize===s.label ? '#2563eb' : '#333', fontWeight:700, fontSize:15, cursor:'pointer' }}>
                    {s.label}{s.price && s.price !== selected.base_price ? <span style={{ display:'block', fontSize:11, fontWeight:500 }}>{s.price} DH</span> : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ background:'#fff', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#555' }}>Infos client</div>
            <input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} placeholder="Nom complet *" style={inp} />
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Téléphone * (06XXXXXXXX)" type="tel" style={inp} />
          </div>
        </div>

        {/* Right col */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#555' }}>Livraison</div>
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Adresse complète *" style={inp} />
            <select value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} style={{ ...inp, background:'#fff', color: form.city ? '#111' : '#999' }}>
              <option value="">Ville *</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (couleur, instructions...)" style={inp} />
          </div>

          <div style={{ background:'#fff', borderRadius:14, padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#555' }}>Quantité</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => setForm(f=>({...f,quantity:Math.max(1,f.quantity-1)}))} style={{ width:38,height:38,borderRadius:10,border:'2px solid #e5e7eb',background:'#f9f9f9',fontSize:20,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
              <span style={{ fontSize:22, fontWeight:700, minWidth:32, textAlign:'center' }}>{form.quantity}</span>
              <button onClick={() => setForm(f=>({...f,quantity:f.quantity+1}))} style={{ width:38,height:38,borderRadius:10,border:'2px solid #e5e7eb',background:'#f9f9f9',fontSize:20,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'#059669' }}>{getPrice()*form.quantity} DH</div>
          </div>
        </div>
      </div>

      {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'12px 16px', borderRadius:12, marginTop:16, fontSize:14, fontWeight:500 }}>{error}</div>}

      <button onClick={confirm} disabled={loading}
        style={{ width:'100%', marginTop:20, padding:'18px', background: loading?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:16, fontSize:18, fontWeight:800, cursor: loading?'wait':'pointer', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
        {loading ? '⏳ Confirmation en cours...' : `✅ Confirmer la commande — ${getPrice()*form.quantity} DH`}
      </button>
    </div>
  );
}
