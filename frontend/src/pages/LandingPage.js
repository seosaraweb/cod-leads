import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';

const CITIES = ['Casablanca','Rabat','Salé','Fès','Marrakech','Agadir','Tanger','Meknès','Oujda','Kenitra','Tétouan','Safi','Mohammédia','Khouribga','Béni Mellal','El Jadida','Nador','Taza','Settat','Berrechid','Khémisset','Inezgane','Ait Melloul','Larache','Ksar El Kebir','Guelmim','Dakhla','Laâyoune','Errachidia','Ouarzazate','Taroudant','Tiznit','Essaouira','Chefchaouen','Al Hoceima','Berkane','Taourirt','Azrou','Moulay Abdellah','Moulay Yaâcoub','Timoulilt-Béni Mellal','Moulay Bouazza Khenifra','Moulay Bouselham','Moul El Bergui-Safi'].sort();
const imgUrl = f => f ? getImageUrl(`/uploads/${f}`) : null;

export default function LandingPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [form, setForm] = useState({ client_name:'', phone:'', address:'', city:'' });
  const [customCity, setCustomCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/public').then(r => {
      setWhatsapp(r.data.whatsapp || '');
      setShopName(r.data.shop_name || '');
    }).catch(() => {});
    api.get(`/landing/${id}`)
      .then(r => {
        setProduct(r.data);
        setActiveImage(r.data.images?.[0] || null);
        if (r.data.variants?.length === 0) setSelectedVariant({ price: r.data.base_price });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const getPrice = () => selectedVariant?.price || product?.base_price || 0;
  const finalCity = CITIES.includes(form.city) ? form.city : customCity;

  const submit = async () => {
    if (!form.client_name || !form.phone || !form.address || !finalCity)
      return setError('Merci de remplir tous les champs');
    if (product.variants?.length > 0 && !selectedVariant)
      return setError('Veuillez choisir une variante');
    setSubmitting(true); setError('');
    try {
      const variantLabel = selectedVariant ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ') : '';
      const res = await api.post('/landing/order', {
        product_id: product.id,
        product_name: product.name,
        product_image: activeImage?.filename || product.images?.[0]?.filename || '',
        variant_id: selectedVariant?.id || null,
        variant_label: variantLabel,
        price: getPrice(),
        quantity: 1,
        client_name: form.client_name,
        phone: form.phone,
        address: form.address,
        city: finalCity,
        notes: '',
      });
      setDone(res.data);
    } catch(e) { setError(e.response?.data?.error || 'Erreur, réessayez'); }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f0' }}>
      <div style={{ fontSize:40 }}>⏳</div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f0', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:64 }}>😕</div>
      <div style={{ fontSize:20, fontWeight:700, color:'#555' }}>Produit introuvable</div>
    </div>
  );

  if (done) return (
    <div style={{ minHeight:'100vh', background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 32px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:72, marginBottom:16 }}>✅</div>
        <h2 style={{ margin:'0 0 8px', fontSize:24, fontWeight:800, color:'#065f46' }}>Commande reçue !</h2>
        <p style={{ color:'#555', fontSize:16, marginBottom:20 }}>Merci <strong>{done.client_name}</strong> ! Notre équipe va vous contacter très prochainement pour confirmer votre commande.</p>
        <div style={{ background:'#f0fdf4', borderRadius:14, padding:'16px', marginBottom:24, textAlign:'left' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['📦 Produit', done.product_name+(done.variant_label?` (${done.variant_label})`:'')],['💰 Prix', `${done.price} DH`],['📍 Ville', done.city],['📱 Téléphone', done.phone]].map(([l,v])=>(
              <div key={l} style={{ background:'#fff', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:12, color:'#888' }}>{l}</div>
                <div style={{ fontWeight:700, fontSize:14, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#eff6ff', borderRadius:12, padding:'14px', color:'#1e40af', fontSize:14, fontWeight:500 }}>
          📞 Vous serez contacté(e) sous 24h pour confirmer votre livraison
        </div>
      </div>
    </div>
  );

  const inp = { padding:'13px 16px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:16, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f0' }}>
      {/* Header */}
      <div style={{ background:'#1a1a2e', color:'#fff', padding:'14px 20px', textAlign:'center' }}>
        <div style={{ fontSize:13, color:'#8888aa' }}>🚚 Livraison partout au Maroc — Paiement à la livraison (COD)</div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px 40px' }}>
        {/* Product name */}
        <h1 style={{ fontSize:22, fontWeight:900, textAlign:'center', margin:'0 0 16px', color:'#1a1a1a', lineHeight:1.3 }}>{product.name}</h1>

        {/* Main image */}
        <div style={{ borderRadius:18, overflow:'hidden', background:'#f0f0f0', marginBottom:10, boxShadow:'0 2px 16px rgba(0,0,0,0.1)' }}>
          {activeImage
            ? <img src={imgUrl(activeImage.filename)} alt={product.name} style={{ width:'100%', display:'block', maxHeight:'70vh', objectFit:'contain' }} />
            : <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>📦</div>}
        </div>

        {/* Thumbnails */}
        {product.images?.length > 1 && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:16 }}>
            {product.images.map(img => (
              <div key={img.id} onClick={() => setActiveImage(img)}
                style={{ flexShrink:0, width:68, height:68, borderRadius:12, overflow:'hidden', cursor:'pointer', border: activeImage?.id===img.id ? '3px solid #2563eb' : '3px solid transparent', boxShadow: activeImage?.id===img.id ? '0 0 0 2px #eff6ff' : 'none' }}>
                <img src={imgUrl(img.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p style={{ background:'#fff', borderRadius:14, padding:'14px 16px', fontSize:15, color:'#555', lineHeight:1.6, margin:'0 0 16px' }}>{product.description}</p>
        )}

        {/* Variants */}
        {product.variants?.length > 0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:12, color:'#1a1a1a' }}>Choisir la variante</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {product.variants.map((v, idx) => {
                const varImg = v.image_id ? product.images?.find(i => i.id === v.image_id) : null;
                const label = [v.size, v.color].filter(Boolean).join(' / ') || `Option ${idx+1}`;
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button key={v.id||idx} onClick={() => {
                    setSelectedVariant(v);
                    if (varImg) setActiveImage(varImg);
                  }}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: isSelected ? '#eff6ff' : '#f9f9f9', border: isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb', borderRadius:12, cursor:'pointer', textAlign:'left', width:'100%', boxSizing:'border-box', transition:'all 0.12s' }}>
                    {varImg
                      ? <div style={{ width:48,height:48,borderRadius:10,overflow:'hidden',flexShrink:0 }}><img src={imgUrl(varImg.filename)} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /></div>
                      : <div style={{ width:48,height:48,borderRadius:10,background:'#e5e7eb',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>📦</div>}
                    <div style={{ flex:1, fontWeight:700, fontSize:16, color:'#1a1a1a' }}>{label}</div>
                    {isSelected && <span style={{ fontSize:18 }}>✓</span>}
                    <div style={{ fontWeight:800, fontSize:17, color:'#059669', flexShrink:0 }}>{v.price} DH</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price */}
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, color:'#888' }}>Prix total</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#059669' }}>{getPrice()} DH</div>
          </div>
          <div style={{ textAlign:'right', fontSize:13, color:'#888', lineHeight:1.8 }}>
            <div>✅ Paiement à la livraison</div>
            <div>🚚 Livraison 2-5 jours</div>
            <div>📞 Confirmation par appel</div>
          </div>
        </div>

        {/* Order form */}
        <div style={{ background:'#fff', borderRadius:16, padding:'20px', marginBottom:16 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800, color:'#1a1a1a' }}>📋 Vos informations</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))}
              placeholder="Nom complet *" style={inp}
              onFocus={e=>e.target.style.borderColor='#2563eb'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
              placeholder="Numéro de téléphone *" type="tel" style={inp}
              onFocus={e=>e.target.style.borderColor='#2563eb'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
              placeholder="Adresse complète *" style={inp}
              onFocus={e=>e.target.style.borderColor='#2563eb'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
            <select value={CITIES.includes(form.city) ? form.city : (form.city===''?'':'__other__')}
              onChange={e => { if(e.target.value==='__other__') setForm(f=>({...f,city:'__other__'})); else setForm(f=>({...f,city:e.target.value})); }}
              style={{ ...inp, background:'#fff', color: form.city?'#111':'#999' }}
              onFocus={e=>e.target.style.borderColor='#2563eb'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">Ville *</option>
              {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
              <option value="__other__">Autre ville...</option>
            </select>
            {form.city==='__other__' && (
              <input value={customCity} onChange={e=>setCustomCity(e.target.value)}
                placeholder="Nom de votre ville *" style={{ ...inp, borderColor:'#f59e0b' }} />
            )}
          </div>
        </div>

        {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'12px 16px', borderRadius:12, marginBottom:12, fontSize:14, fontWeight:500 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width:'100%', padding:'18px', background: submitting?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:16, fontSize:18, fontWeight:900, cursor: submitting?'wait':'pointer', boxShadow:'0 4px 20px rgba(37,99,235,0.35)', letterSpacing:0.3 }}>
          {submitting ? '⏳ Envoi en cours...' : `🛒 Commander — ${getPrice()} DH`}
        </button>
        <p style={{ textAlign:'center', fontSize:13, color:'#aaa', marginTop:12 }}>
          Vous serez contacté(e) pour confirmer avant livraison
        </p>

        {whatsapp && (
          <div style={{ marginTop:16 }}>
            <div style={{ textAlign:'center', fontSize:13, color:'#aaa', marginBottom:10 }}>— ou contactez-nous directement —</div>
            <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par ${product?.name}`)}`}
              target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#25d366', color:'#fff', padding:'15px', borderRadius:14, textDecoration:'none', fontWeight:700, fontSize:16, boxShadow:'0 4px 16px rgba(37,211,102,0.3)' }}>
              <span style={{ fontSize:24 }}>💬</span> Contacter sur WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
