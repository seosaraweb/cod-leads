import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../utils/api';

const imgUrl = f => f ? getImageUrl(`/uploads/${f}`) : null;

export default function LandingPages() {
  const [products, setProducts] = useState([]);
  const [copied, setCopied] = useState(null);
  const [copyLang, setCopyLang] = useState('fr');

  useEffect(() => {
    api.get('/products/all').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const [copyLang, setCopyLang] = useState('fr');

  const getMessage = (p, lang) => {
    const url = `${window.location.origin}/p/${p.id}`;
    const minPrice = p.variants?.length > 0
      ? Math.min(...p.variants.map(v => Number(v.price) || Number(p.base_price)))
      : Number(p.base_price);

    if (lang === 'ar') {
      return `واش شفتي هاد الموديل 😍

*${p.name}*

بسعر ${minPrice} درهم فقط 🔥
الدفع عند الاستلام ✅
التوصيل لعندك 🚚

شوفي وطلبي من هنا 👇
${url}`;
    }
    return `T'as vu ce modèle ? 😍

*${p.name}*

Seulement ${minPrice} DH 🔥
Paiement à la livraison ✅
Livraison chez toi 🚚

Regarde et commande ici 👇
${url}`;
  };

  const copyMessage = (p, lang) => {
    navigator.clipboard.writeText(getMessage(p, lang));
    setCopied(p.id + '_' + lang);
    setTimeout(() => setCopied(null), 2500);
  };

  const openLink = (id) => window.open(`/p/${id}`, '_blank');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🔗 Landing Pages</h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          Une page de vente par produit — envoyez le lien à vos clients WhatsApp
        </p>
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#aaa' }}>
          <div style={{ fontSize: 48 }}>📦</div>
          <div style={{ marginTop: 12, fontWeight: 600 }}>Aucun produit</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Créez d'abord un produit dans la section Produits</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {products.map(p => {
          const firstImg = p.images?.[0];
          const url = `${window.location.origin}/p/${p.id}`;
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'stretch', opacity: p.active ? 1 : 0.5 }}>
              {/* Thumbnail */}
              <div style={{ width: 90, flexShrink: 0, background: '#f0f0f0', overflow: 'hidden' }}>
                {firstImg
                  ? <img src={imgUrl(firstImg.filename)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  <span style={{ background: p.active ? '#d1fae5' : '#f3f4f6', color: p.active ? '#065f46' : '#888', fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>
                    {p.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                  {p.variants?.length > 0
                    ? `${p.variants.length} variante${p.variants.length > 1 ? 's' : ''}`
                    : `${p.base_price} DH`}
                  {p.images?.length > 0 && ` · ${p.images.length} photo${p.images.length > 1 ? 's' : ''}`}
                </div>

                {/* URL display */}
                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#555', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {url}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 12px 12px 0', flexShrink: 0, justifyContent: 'center' }}>
                <button onClick={() => openLink(p.id)}
                  style={{ padding:'8px 14px', background:'#f0fdf4', color:'#16a34a', border:'none', borderRadius:9, fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  👁️ Aperçu
                </button>
                <button onClick={() => copyMessage(p, 'fr')}
                  style={{ padding:'8px 14px', background: copied===p.id+'_fr'?'#d1fae5':'#eff6ff', color: copied===p.id+'_fr'?'#065f46':'#2563eb', border:'none', borderRadius:9, fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                  {copied===p.id+'_fr' ? '✅ Copié !' : '📋 Message FR'}
                </button>
                <button onClick={() => copyMessage(p, 'ar')}
                  style={{ padding:'8px 14px', background: copied===p.id+'_ar'?'#d1fae5':'#fef3c7', color: copied===p.id+'_ar'?'#065f46':'#92400e', border:'none', borderRadius:9, fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                  {copied===p.id+'_ar' ? '✅ تم !' : '📋 رسالة عربي'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      {products.length > 0 && (
        <div style={{ background: '#eff6ff', borderRadius: 14, padding: '16px 20px', marginTop: 20, border: '1.5px solid #dbeafe' }}>
          <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>💡 Comment utiliser</div>
          <div style={{ fontSize: 14, color: '#1e40af', lineHeight: 1.7 }}>
            1. Clique <strong>📋 Copier lien</strong> pour copier l'URL du produit<br/>
            2. Ou clique <strong>📱 WhatsApp</strong> pour copier un message prêt à envoyer<br/>
            3. Le client clique, remplit son adresse et commande<br/>
            4. La commande apparaît dans <strong>Commandes</strong> avec statut "en attente"
          </div>
        </div>
      )}
    </div>
  );
}
