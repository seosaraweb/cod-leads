import { OZONE_CITIES } from '../utils/ozoneCities';
import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const imgUrl = f => f ? getImageUrl(`/uploads/${f}`) : null;
const STEP = { PRODUCT:1, VARIANT:2, CLIENT:3, DONE:4 };

export default function NewOrder() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(STEP.PRODUCT);

  // Cart — multiple items
  const [cart, setCart] = useState([]); // [{product, variant, image, price, quantity}]

  // Current item being picked
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [selColor, setSelColor] = useState(null);

  const [form, setForm] = useState({ client_name:'', phone:'', address:'', city:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/products').then(r => setProducts(r.data)).catch(()=>{}); }, []);

  const pickProduct = (p) => {
    setProduct(p); setActiveImage(p.images?.[0] || null); setVariant(null);
    // Auto-select first color
    const firstColor = p.variants?.map(v => v.color).filter(Boolean)[0] || null;
    setSelColor(firstColor);
    if (p.variants?.length > 0) setStep(STEP.VARIANT);
    else setStep(STEP.CLIENT);
  };

  const pickVariant = (v) => {
    setVariant(v);
    if (v.image_id) { const img = product.images?.find(i => i.id === v.image_id); if (img) setActiveImage(img); }
    setStep(STEP.CLIENT);
  };

  const getBasePrice = () => variant?.price || product?.base_price || 0;
  const getVariantLabel = () => variant ? [variant.size, variant.color].filter(Boolean).join(' / ') : '';

  // Add current product to cart and pick another
  const addToCart = () => {
    const item = {
      product, variant, activeImage,
      price: getBasePrice(), quantity: 1,
      label: getVariantLabel(),
    };
    setCart(c => [...c, item]);
    setProduct(null); setVariant(null); setActiveImage(null);
    setStep(STEP.PRODUCT);
  };

  const removeFromCart = (idx) => setCart(c => c.filter((_,i) => i !== idx));
  const updateCartItem = (idx, key, val) => setCart(c => c.map((item, i) => i === idx ? {...item, [key]: val} : item));

  const cartTotal = cart.reduce((s, item) => s + (Number(item.price)||0) * (item.quantity||1), 0);

  const confirm = async () => {
    if (!form.client_name || !form.phone || !form.address || !form.city)
      return setError('Remplis tous les champs obligatoires');
    if (cart.length === 0) return setError('Ajoute au moins un produit');
    setLoading(true); setError('');
    try {
      // Create one order per cart item, or combine into notes
      const mainItem = cart[0];
      const extraItems = cart.slice(1);
      const notesExtra = extraItems.length > 0
        ? extraItems.map(item => `+ ${item.product.name}${item.label?' ('+item.label+')':''} x${item.quantity} — ${item.price}DH`).join(', ')
        : '';
      const notes = [form.notes, notesExtra].filter(Boolean).join(' | ');
      const productName = cart.length > 1
        ? cart.map(item => `${item.product.name}${item.label?' ('+item.label+')':''}`).join(' + ')
        : mainItem.product.name;

      const res = await api.post('/orders', {
        product_id: mainItem.product.id,
        product_name: productName,
        product_image: mainItem.activeImage?.filename || mainItem.product.images?.[0]?.filename || '',
        variant_id: mainItem.variant?.id || null,
        variant_label: mainItem.label || '',
        price: cartTotal,
        quantity: 1,
        notes,
        ...form
      });
      setSuccess(res.data);
      setStep(STEP.DONE);
    } catch(e) { setError(e.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const reset = () => {
    setStep(STEP.PRODUCT); setProduct(null); setVariant(null); setActiveImage(null);
    setCart([]); setForm({ client_name:'', phone:'', address:'', city:'', notes:'' });
    setSuccess(null); setError('');
  };

  const inp = { padding:'12px 14px', borderRadius:10, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

  // ── DONE ──
  if (step === STEP.DONE && success) return (
    <div style={{ maxWidth:520, margin:'0 auto' }}>
      <div style={{ textAlign:'center', padding:'36px 0 24px' }}>
        <div style={{ fontSize:72 }}>✅</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#065f46', marginTop:12 }}>Commande confirmée !</div>
        <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:'#2563eb', marginTop:10, background:'#eff6ff', display:'inline-block', padding:'8px 24px', borderRadius:99 }}>{success.order_ref}</div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, padding:'20px', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['👤',success.client_name],['📱',success.phone],['📍',success.city],['💰',`${success.price} DH`]].map(([icon,val],i)=>(
            <div key={i} style={{ background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
              <div style={{ fontWeight:700, fontSize:14 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>📦 Produit(s)</div>
          <div style={{ fontWeight:600 }}>{success.product_name}</div>
        </div>
        <div style={{ marginTop:10, background:'#f9f9f9', borderRadius:10, padding:'12px' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:2 }}>📍 Adresse</div>
          <div style={{ fontWeight:600 }}>{success.address}, {success.city}</div>
        </div>
      </div>
      <button onClick={reset} style={{ width:'100%', padding:'16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:14, fontSize:18, fontWeight:700, cursor:'pointer' }}>➕ Nouvelle commande</button>
    </div>
  );

  // ── STEP 1 : PRODUCT GRID ──
  if (step === STEP.PRODUCT) return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>Nouvelle commande</h1>
        <p style={{ margin:'4px 0 0', color:'#888', fontSize:14 }}>
          {cart.length === 0 ? `Bonjour ${user?.username} — choisis le produit` : `${cart.length} article(s) dans le panier — ajoute un autre ou`}
          {cart.length > 0 && <button onClick={() => setStep(STEP.CLIENT)} style={{ marginLeft:8, background:'#2563eb', color:'#fff', border:'none', borderRadius:8, padding:'4px 12px', cursor:'pointer', fontSize:13, fontWeight:700 }}>Continuer →</button>}
        </p>
      </div>

      {/* Cart summary */}
      {cart.length > 0 && (
        <div style={{ background:'#f0fdf4', borderRadius:14, padding:'14px 16px', marginBottom:16, border:'1.5px solid #bbf7d0' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#166534', marginBottom:8 }}>🛒 Panier ({cart.length} article{cart.length>1?'s':''})</div>
          {cart.map((item, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              {item.activeImage?.filename && <img src={imgUrl(item.activeImage.filename)} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0 }} />}
              <div style={{ flex:1, fontSize:14 }}>
                <span style={{ fontWeight:600 }}>{item.product.name}</span>
                {item.label && <span style={{ marginLeft:6, background:'#2563eb', color:'#fff', fontSize:11, padding:'1px 7px', borderRadius:99 }}>{item.label}</span>}
              </div>
              <span style={{ fontWeight:700, color:'#059669' }}>{item.price} DH</span>
              <button onClick={() => removeFromCart(idx)} style={{ background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:7, width:28, height:28, cursor:'pointer', fontWeight:700, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          ))}
          <div style={{ borderTop:'1px solid #bbf7d0', paddingTop:8, marginTop:4, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:16 }}>
            <span>Total</span><span style={{ color:'#059669' }}>{cartTotal} DH</span>
          </div>
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
        {products.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:80, color:'#aaa' }}><div style={{ fontSize:56 }}>📦</div><div style={{ marginTop:12, fontWeight:600 }}>Aucun produit actif</div></div>}
      </div>
    </div>
  );

  // ── STEP 2 : VARIANT PICKER — couleur d'abord, puis taille ──
  if (step === STEP.VARIANT) {
    // Get unique colors
    const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
    const hasColors = colors.length > 0;

    // Filter variants by selected color
    const filteredVariants = (hasColors && selColor)
      ? product.variants.filter(v => v.color === selColor)
      : product.variants;

    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <button onClick={()=>setStep(STEP.PRODUCT)} style={{ width:42,height:42,borderRadius:12,border:'2px solid #e5e7eb',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>←</button>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{product.name}</h2>
        </div>
        <div style={{ borderRadius:16, overflow:'hidden', background:'#f0f0f0', aspectRatio:'4/3', marginBottom:10 }}>
          {activeImage ? <img src={imgUrl(activeImage.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                       : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>📦</div>}
        </div>
        {product.images?.length > 1 && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:12 }}>
            {product.images.map(img => (
              <div key={img.id} onClick={() => setActiveImage(img)} style={{ flexShrink:0, width:64, height:64, borderRadius:10, overflow:'hidden', cursor:'pointer', border: activeImage?.id===img.id ? '3px solid #2563eb' : '3px solid transparent' }}>
                <img src={imgUrl(img.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            ))}
          </div>
        )}

        {/* Couleur selector */}
        {hasColors && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#555', marginBottom:8 }}>🎨 Couleur</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {colors.map(color => {
                const colorVariant = product.variants.find(v => v.color === color);
                const colorImg = colorVariant?.image_id ? product.images?.find(i => i.id === colorVariant.image_id) : null;
                return (
                  <button key={color} onClick={() => { setSelColor(color); if(colorImg) setActiveImage(colorImg); }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:12, border: selColor===color ? '2px solid #2563eb' : '2px solid #e5e7eb', background: selColor===color ? '#eff6ff' : '#fff', cursor:'pointer', fontWeight:700, fontSize:14 }}>
                    {colorImg && <img src={imgUrl(colorImg.filename)} alt="" style={{ width:28,height:28,borderRadius:6,objectFit:'cover' }} />}
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Taille selector */}
        <div style={{ fontWeight:700, fontSize:14, color:'#555', marginBottom:8 }}>📏 Taille</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filteredVariants.map((v, idx) => {
            const label = v.size || [v.size, v.color].filter(Boolean).join(' / ') || `Variante ${idx+1}`;
            return (
              <button key={v.id||idx} onClick={() => pickVariant(v)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', border:'2px solid #e5e7eb', borderRadius:14, cursor:'pointer', textAlign:'left', width:'100%', boxSizing:'border-box' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.background='#eff6ff';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#fff';}}>
                <div style={{ flex:1, fontWeight:700, fontSize:18 }}>{label}</div>
                <div style={{ fontWeight:800, fontSize:18, color:'#059669', flexShrink:0 }}>{v.price} DH →</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── STEP 3 : CLIENT FORM ──
  return (
    <div>
      {/* Header recap */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
        <button onClick={() => setStep(product?.variants?.length > 0 ? STEP.VARIANT : STEP.PRODUCT)}
          style={{ width:42,height:42,borderRadius:12,border:'2px solid #e5e7eb',background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>←</button>
        {activeImage?.filename
          ? <img src={imgUrl(activeImage.filename)} alt="" style={{ width:56,height:56,borderRadius:12,objectFit:'cover',flexShrink:0 }} />
          : <div style={{ width:56,height:56,background:'#f0f0f0',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0 }}>📦</div>}
        <div>
          <div style={{ fontWeight:800, fontSize:17 }}>{product?.name}</div>
          {variant && <div style={{ fontSize:13, color:'#2563eb', fontWeight:600 }}>{getVariantLabel()}</div>}
          <div style={{ fontSize:15, fontWeight:800, color:'#059669' }}>{getBasePrice()} DH</div>
        </div>
      </div>

      {/* Cart items */}
      {cart.length > 0 && (
        <div style={{ background:'#f0fdf4', borderRadius:14, padding:'12px 16px', marginBottom:16, border:'1.5px solid #bbf7d0' }}>
          <div style={{ fontWeight:700, fontSize:13, color:'#166534', marginBottom:8 }}>🛒 Déjà dans le panier</div>
          {cart.map((item, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{item.product.name}{item.label?' ('+item.label+')':''}</span>
              <span style={{ color:'#059669', fontWeight:700, fontSize:13 }}>{item.price} DH × {item.quantity}</span>
              <button onClick={() => removeFromCart(idx)} style={{ background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:6, width:24, height:24, cursor:'pointer', fontSize:14, fontWeight:700 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Current item config */}
      <CurrentItemPanel
        product={product} variant={variant} activeImage={activeImage}
        getBasePrice={getBasePrice} getVariantLabel={getVariantLabel}
        onAddAndContinue={(item) => {
          setCart(c => [...c, item]);
          setProduct(null); setVariant(null); setActiveImage(null);
          setStep(STEP.PRODUCT);
        }}
        onValidate={(item) => {
          setCart(c => [...c, item]);
        }}
      />

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
            <select 
              value={OZONE_CITIES.some(c => c.NAME === form.city) ? form.city : '__other__'} 
              onChange={e => {
                if (e.target.value === '__other__') setForm(f=>({...f, city:''}));
                else setForm(f=>({...f, city:e.target.value}));
              }}
              style={{ ...inp, background:'#fff', color: form.city?'#111':'#999' }}>
              <option value="__other__">-- Ville * --</option>
              {OZONE_CITIES.map(c=><option key={c.ID} value={c.NAME}>{c.NAME}</option>)}
              <option value="__other__">✏️ Autre ville (saisir manuellement)</option>
            </select>
            {!OZONE_CITIES.some(c => c.NAME === form.city) && (
              <input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}
                placeholder="Nom de la ville *"
                style={{ ...inp, borderColor:'#f59e0b', background:'#fffbeb' }} />
            )}
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes spéciales..." style={inp} />
          </div>
        </div>
      </div>

      {/* Total */}
      {cart.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, padding:'14px 18px', marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, fontSize:15, color:'#555' }}>Total ({cart.length} article{cart.length>1?'s':''})</span>
          <span style={{ fontWeight:900, fontSize:24, color:'#059669' }}>{cartTotal} DH</span>
        </div>
      )}

      {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'12px 16px', borderRadius:12, marginTop:14, fontSize:14, fontWeight:500 }}>{error}</div>}

      <button onClick={confirm} disabled={loading || cart.length === 0}
        style={{ width:'100%', marginTop:16, padding:'18px', background: (loading||cart.length===0)?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:16, fontSize:18, fontWeight:800, cursor: (loading||cart.length===0)?'not-allowed':'pointer', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
        {loading ? '⏳ Confirmation...' : cart.length === 0 ? 'Valide d\'abord un article ↑' : `✅ Confirmer — ${cartTotal} DH`}
      </button>
    </div>
  );
}

function CurrentItemPanel({ product, variant, activeImage, getBasePrice, getVariantLabel, onAddAndContinue, onValidate }) {
  const [price, setPrice] = React.useState(getBasePrice());
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => { setPrice(getBasePrice()); setQty(1); }, [product, variant]);

  const buildItem = () => ({
    product, variant,
    activeImage: activeImage || product?.images?.[0],
    price: Number(price) || getBasePrice(),
    quantity: qty,
    label: getVariantLabel()
  });

  const inp2 = { padding:'10px 14px', borderRadius:10, border:'2px solid #e5e7eb', fontSize:16, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };

  return (
    <div style={{ background:'#fff', borderRadius:14, padding:'16px', marginBottom:12 }}>
      <div style={{ fontWeight:700, fontSize:14, color:'#666', marginBottom:12 }}>📦 Article en cours</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:4 }}>Prix unitaire (DH)</label>
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inp2, width:'100%' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:4 }}>Quantité</label>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width:38,height:38,borderRadius:10,border:'2px solid #e5e7eb',background:'#f9f9f9',fontSize:20,cursor:'pointer',fontWeight:700,flexShrink:0 }}>−</button>
            <span style={{ flex:1, textAlign:'center', fontSize:20, fontWeight:800 }}>{qty}</span>
            <button onClick={() => setQty(q => q+1)} style={{ width:38,height:38,borderRadius:10,border:'2px solid #e5e7eb',background:'#f9f9f9',fontSize:20,cursor:'pointer',fontWeight:700,flexShrink:0 }}>+</button>
          </div>
        </div>
      </div>
      <div style={{ textAlign:'center', fontSize:22, fontWeight:800, color:'#059669', marginBottom:12 }}>
        {(Number(price)||0) * qty} DH
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => onAddAndContinue(buildItem())}
          style={{ flex:1, padding:'11px', background:'#f0fdf4', color:'#166534', border:'2px solid #bbf7d0', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ➕ Ajouter + autre produit
        </button>
        <button onClick={() => onValidate(buildItem())}
          style={{ padding:'11px 18px', background:'#eff6ff', color:'#2563eb', border:'2px solid #dbeafe', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ✓ OK
        </button>
      </div>
    </div>
  );
}
