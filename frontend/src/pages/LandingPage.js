import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';

const imgUrl = f => f ? getImageUrl(`/uploads/${f}`) : null;

const CITIES = ['Casablanca','Rabat','Salé','Fès','Marrakech','Agadir','Tanger','Meknès','Oujda','Kenitra','Tétouan','Safi','Mohammédia','Khouribga','Béni Mellal','El Jadida','Nador','Taza','Settat','Berrechid','Khémisset','Inezgane','Ait Melloul','Larache','Ksar El Kebir','Guelmim','Dakhla','Laâyoune','Errachidia','Ouarzazate','Taroudant','Tiznit','Essaouira','Chefchaouen','Al Hoceima','Berkane','Taourirt','Azrou','Moulay Abdellah','Moulay Yaâcoub','Timoulilt-Béni Mellal','Moulay Bouazza Khenifra','Moulay Bouselham','Moul El Bergui-Safi'].sort();

const T = {
  fr: {
    dir: 'ltr',
    delivery: '🚚 Livraison partout au Maroc — Paiement à la livraison (COD)',
    chooseVariant: 'Choisir la variante',
    totalPrice: 'Prix total',
    payOnDelivery: '✅ Paiement à la livraison',
    deliveryDays: '🚚 Livraison 1-3 jours',
    confirmCall: '📞 Confirmation par appel',
    yourInfo: '📋 Vos informations',
    fullName: 'Nom complet *',
    phone: 'Numéro de téléphone *',
    address: 'Adresse complète *',
    city: 'Ville *',
    otherCity: 'Autre ville...',
    otherCityInput: 'Nom de votre ville *',
    orderBtn: (price) => `🛒 Commander — ${price} DH`,
    sending: '⏳ Envoi en cours...',
    contactUs: '— ou contactez-nous directement —',
    whatsappBtn: 'Contacter sur WhatsApp',
    whatsappMsg: (name) => `Bonjour, je suis intéressé(e) par ${name}`,
    confirm: 'Vous serez contacté(e) pour confirmer avant livraison',
    successTitle: 'Commande reçue !',
    successMsg: (name) => `Merci ${name} ! Notre équipe va vous contacter très prochainement pour confirmer votre commande.`,
    successNote: '📞 Vous serez contacté(e) sous 24h pour confirmer votre livraison',
    fieldProduct: '📦 Produit', fieldPrice: '💰 Prix', fieldCity: '📍 Ville', fieldPhone: '📱 Téléphone',
    errorFill: 'Merci de remplir tous les champs',
    errorVariant: 'Veuillez choisir une variante',
  },
  ar: {
    dir: 'rtl',
    delivery: '🚚 التوصيل في جميع أنحاء المغرب — الدفع عند الاستلام',
    chooseVariant: 'اختر المقاس أو اللون',
    totalPrice: 'السعر الإجمالي',
    payOnDelivery: '✅ الدفع عند الاستلام',
    deliveryDays: '🚚 التوصيل خلال 1-3 أيام',
    confirmCall: '📞 تأكيد بالاتصال',
    yourInfo: '📋 معلوماتك',
    fullName: 'الاسم الكامل *',
    phone: 'رقم الهاتف *',
    address: 'العنوان الكامل *',
    city: 'المدينة *',
    otherCity: 'مدينة أخرى...',
    otherCityInput: 'اسم مدينتك *',
    orderBtn: (price) => `🛒 اطلب الآن — ${price} درهم`,
    sending: '⏳ جاري الإرسال...',
    contactUs: '— أو تواصل معنا مباشرة —',
    whatsappBtn: 'تواصل عبر واتساب',
    whatsappMsg: (name) => `مرحبا، أنا مهتم/ة بـ ${name}`,
    confirm: 'سيتم التواصل معك لتأكيد طلبك قبل التوصيل',
    successTitle: 'تم استلام طلبك!',
    successMsg: (name) => `شكراً ${name}! سيتواصل معك فريقنا قريباً لتأكيد طلبك.`,
    successNote: '📞 سيتم الاتصال بك خلال 24 ساعة لتأكيد التوصيل',
    fieldProduct: '📦 المنتج', fieldPrice: '💰 السعر', fieldCity: '📍 المدينة', fieldPhone: '📱 الهاتف',
    errorFill: 'يرجى ملء جميع الحقول المطلوبة',
    errorVariant: 'يرجى اختيار مقاس أو لون',
  }
};

// Detect browser language
const detectLang = () => {
  const lang = navigator.language || navigator.userLanguage || 'fr';
  return lang.startsWith('ar') ? 'ar' : 'fr';
};

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
  const [error, setError] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [lang, setLang] = useState(detectLang);

  // Lightbox
  const [lightbox, setLightbox] = useState(null);
  const t = T[lang];

  useEffect(() => {
    api.get('/settings/public').then(r => setWhatsapp(r.data.whatsapp || '')).catch(() => {});
    api.get(`/landing/${id}`)
      .then(r => {
        setProduct(r.data);
        setActiveImage(r.data.images?.[0] || null);
        if (!r.data.variants?.length) setSelectedVariant({ price: r.data.base_price });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const getPrice = () => selectedVariant?.price || product?.base_price || 0;
  const finalCity = CITIES.includes(form.city) ? form.city : customCity;

  const submit = async () => {
    if (!form.client_name || !form.phone || !form.address || !finalCity) return setError(t.errorFill);
    if (product.variants?.length > 0 && !selectedVariant) return setError(t.errorVariant);
    setSubmitting(true); setError('');
    try {
      const variantLabel = selectedVariant ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' / ') : '';
      const res = await api.post('/landing/order', {
        product_id: product.id, product_name: product.name,
        product_image: activeImage?.filename || product.images?.[0]?.filename || '',
        variant_id: selectedVariant?.id || null, variant_label: variantLabel,
        price: getPrice(), quantity: 1,
        client_name: form.client_name, phone: form.phone,
        address: form.address, city: finalCity, notes: '',
      });
      setDone(res.data);
    } catch(e) { setError(e.response?.data?.error || 'Erreur'); }
    setSubmitting(false);
  };



  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ fontSize:40 }}>⏳</div></div>;
  if (notFound) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}><div style={{ fontSize:64 }}>😕</div><div style={{ fontSize:20, fontWeight:700, color:'#555' }}>Produit introuvable</div></div>;

  if (done) return (
    <div style={{ minHeight:'100vh', background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} dir={t.dir}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 32px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:72, marginBottom:16 }}>✅</div>
        <h2 style={{ margin:'0 0 8px', fontSize:24, fontWeight:800, color:'#065f46' }}>{t.successTitle}</h2>
        <p style={{ color:'#555', fontSize:16, marginBottom:20 }}>{t.successMsg(done.client_name)}</p>
        <div style={{ background:'#f0fdf4', borderRadius:14, padding:'16px', marginBottom:24, textAlign: t.dir==='rtl'?'right':'left' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[[t.fieldProduct, done.product_name+(done.variant_label?` (${done.variant_label})`:'')],[t.fieldPrice,`${done.price} DH`],[t.fieldCity,done.city],[t.fieldPhone,done.phone]].map(([l,v])=>(
              <div key={l} style={{ background:'#fff', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:12, color:'#888' }}>{l}</div>
                <div style={{ fontWeight:700, fontSize:14, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'#eff6ff', borderRadius:12, padding:'14px', color:'#1e40af', fontSize:14, fontWeight:500 }}>{t.successNote}</div>
      </div>
    </div>
  );

  const inp = { padding:'13px 16px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:16, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', textAlign: t.dir==='rtl'?'right':'left' };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f0' }} dir={t.dir}>
      {/* Lightbox — tap anywhere to close, pinch to zoom natively */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', touchAction:'pinch-zoom' }}>
          <button onClick={() => setLightbox(null)}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:44, height:44, borderRadius:'50%', fontSize:22, cursor:'pointer', zIndex:1001 }}>✕</button>
          <img src={imgUrl(lightbox)} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth:'100vw', maxHeight:'100vh', objectFit:'contain', touchAction:'pinch-zoom', userSelect:'none' }} />
        </div>
      )}

      {/* Top bar */}
      <div style={{ background:'#1a1a2e', color:'#fff', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, color:'#8888aa', flex:1 }}>{t.delivery}</span>
        {/* Language toggle */}
        <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:12 }}>
          {['fr','ar'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding:'4px 10px', borderRadius:8, border:'none', background: lang===l ? '#2563eb' : 'rgba(255,255,255,0.1)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight: lang===l ? 700 : 400 }}>
              {l === 'fr' ? 'FR' : 'ع'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px 40px' }}>
        <h1 style={{ fontSize:22, fontWeight:900, textAlign:'center', margin:'0 0 16px', color:'#1a1a1a', lineHeight:1.3 }}>{product.name}</h1>

        {/* Main image — tap to open lightbox */}
        <div style={{ borderRadius:18, overflow:'hidden', background:'#f0f0f0', marginBottom:10, boxShadow:'0 2px 16px rgba(0,0,0,0.1)', cursor:'pointer' }}
          onClick={() => activeImage && setLightbox(activeImage.filename)}>
          {activeImage
            ? <img src={imgUrl(activeImage.filename)} alt={product.name} style={{ width:'100%', display:'block', maxHeight:'70vh', objectFit:'contain' }} />
            : <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>📦</div>}

        </div>

        {/* Thumbnails */}
        {product.images?.length > 1 && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:16 }}>
            {product.images.map(img => (
              <div key={img.id} onClick={() => setActiveImage(img)}
                style={{ flexShrink:0, width:68, height:68, borderRadius:12, overflow:'hidden', cursor:'pointer', border: activeImage?.id===img.id ? '3px solid #2563eb' : '3px solid transparent' }}>
                <img src={imgUrl(img.filename)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            ))}
          </div>
        )}

        {product.description && (
          <p style={{ background:'#fff', borderRadius:14, padding:'14px 16px', fontSize:15, color:'#555', lineHeight:1.6, margin:'0 0 16px' }}>{product.description}</p>
        )}

        {/* Variants */}
        {product.variants?.length > 0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>{t.chooseVariant}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {product.variants.map((v, idx) => {
                const varImg = v.image_id ? product.images?.find(i => i.id === v.image_id) : null;
                const label = [v.size, v.color].filter(Boolean).join(' / ') || `Option ${idx+1}`;
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button key={v.id||idx} onClick={() => { setSelectedVariant(v); if(varImg) setActiveImage(varImg); }}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: isSelected?'#eff6ff':'#f9f9f9', border: isSelected?'2px solid #2563eb':'2px solid #e5e7eb', borderRadius:12, cursor:'pointer', textAlign: t.dir==='rtl'?'right':'left', width:'100%', boxSizing:'border-box' }}>
                    {varImg ? <div style={{ width:48,height:48,borderRadius:10,overflow:'hidden',flexShrink:0 }}><img src={imgUrl(varImg.filename)} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /></div>
                            : <div style={{ width:48,height:48,borderRadius:10,background:'#e5e7eb',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>📦</div>}
                    <div style={{ flex:1, fontWeight:700, fontSize:16 }}>{label}</div>
                    {isSelected && <span style={{ fontSize:18 }}>✓</span>}
                    <div style={{ fontWeight:800, fontSize:17, color:'#059669', flexShrink:0 }}>{v.price} DH</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price */}
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexDirection: t.dir==='rtl'?'row-reverse':'row' }}>
          <div>
            <div style={{ fontSize:13, color:'#888' }}>{t.totalPrice}</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#059669' }}>{getPrice()} DH</div>
          </div>
          <div style={{ textAlign: t.dir==='rtl'?'left':'right', fontSize:13, color:'#888', lineHeight:1.8 }}>
            <div>{t.payOnDelivery}</div>
            <div>{t.deliveryDays}</div>
            <div>{t.confirmCall}</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ background:'#fff', borderRadius:16, padding:'20px', marginBottom:16 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800 }}>{t.yourInfo}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} placeholder={t.fullName} style={inp} />
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder={t.phone} type="tel" style={inp} />
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder={t.address} style={inp} />
            <select value={CITIES.includes(form.city)?form.city:(form.city===''?'':'__other__')}
              onChange={e => e.target.value==='__other__' ? setForm(f=>({...f,city:'__other__'})) : setForm(f=>({...f,city:e.target.value}))}
              style={{ ...inp, background:'#fff', color: form.city?'#111':'#999' }}>
              <option value="">{t.city}</option>
              {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
              <option value="__other__">{t.otherCity}</option>
            </select>
            {form.city==='__other__' && (
              <input value={customCity} onChange={e=>setCustomCity(e.target.value)} placeholder={t.otherCityInput} style={{ ...inp, borderColor:'#f59e0b' }} />
            )}
          </div>
        </div>

        {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'12px 16px', borderRadius:12, marginBottom:12, fontSize:14, fontWeight:500 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width:'100%', padding:'18px', background: submitting?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:16, fontSize:18, fontWeight:900, cursor: submitting?'wait':'pointer', boxShadow:'0 4px 20px rgba(37,99,235,0.35)' }}>
          {submitting ? t.sending : t.orderBtn(getPrice())}
        </button>
        <p style={{ textAlign:'center', fontSize:13, color:'#aaa', marginTop:12 }}>{t.confirm}</p>


      </div>

      {/* Floating WhatsApp button */}
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(t.whatsappMsg(product?.name))}`}
          target="_blank" rel="noreferrer"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 999,
            width: 60, height: 60, borderRadius: '50%',
            background: '#25d366', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(37,211,102,0.5)',
            animation: 'pulse 2s infinite'
          }}>
          <svg viewBox="0 0 32 32" width="32" height="32" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1C7.716 1 1 7.716 1 16c0 2.628.672 5.1 1.848 7.26L1 31l7.94-1.82A14.94 14.94 0 0016 31c8.284 0 15-6.716 15-15S24.284 1 16 1zm0 27.4a12.34 12.34 0 01-6.3-1.72l-.452-.268-4.712 1.08 1.116-4.596-.296-.472A12.36 12.36 0 013.6 16C3.6 9.15 9.15 3.6 16 3.6S28.4 9.15 28.4 16 22.85 28.4 16 28.4zm6.764-9.256c-.368-.184-2.18-1.076-2.52-1.196-.34-.124-.588-.184-.836.184-.248.368-.96 1.196-1.176 1.444-.216.248-.432.276-.8.092-.368-.184-1.556-.572-2.964-1.828-1.096-.976-1.836-2.18-2.052-2.548-.216-.368-.024-.568.16-.752.164-.164.368-.432.552-.648.184-.216.244-.368.368-.616.124-.248.06-.464-.032-.648-.092-.184-.836-2.012-1.144-2.756-.3-.724-.608-.624-.836-.636l-.712-.012c-.248 0-.648.092-.988.46s-1.3 1.272-1.3 3.1c0 1.828 1.332 3.596 1.516 3.844.184.248 2.624 4.004 6.356 5.616.888.384 1.58.612 2.12.784.892.284 1.704.244 2.348.148.716-.108 2.18-.892 2.488-1.752.308-.86.308-1.596.216-1.752-.088-.156-.336-.248-.704-.432z"/>
          </svg>
        </a>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 4px 20px rgba(37,211,102,0.5); }
          50% { box-shadow: 0 4px 32px rgba(37,211,102,0.8), 0 0 0 8px rgba(37,211,102,0.15); }
          100% { box-shadow: 0 4px 20px rgba(37,211,102,0.5); }
        }
      `}</style>
    </div>
  );
}
