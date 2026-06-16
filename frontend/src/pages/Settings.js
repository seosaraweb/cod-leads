import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Settings() {
  const [form, setForm] = useState({ whatsapp: '', shop_name: '', shop_logo: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setForm(f => ({ ...f, ...r.data }))).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await api.put('/settings', form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = { padding:'12px 16px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

  return (
    <div>
      <h1 style={{ margin:'0 0 24px', fontSize:22, fontWeight:800 }}>⚙️ Paramètres</h1>

      <div style={{ background:'#fff', borderRadius:16, padding:'24px', maxWidth:520 }}>

        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#555', marginBottom:6 }}>
            📱 Numéro WhatsApp
          </label>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:20 }}>🇲🇦</span>
            <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              placeholder="212XXXXXXXXX (sans + ni 0)" style={{ ...inp, flex:1 }} />
          </div>
          <div style={{ fontSize:12, color:'#aaa', marginTop:5 }}>
            Format international sans le + : ex <strong>212661234567</strong> pour 0661234567
          </div>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#555', marginBottom:6 }}>
            🏪 Nom de la boutique (affiché sur la landing page)
          </label>
          <input value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))}
            placeholder="Ex: Lili Discount" style={inp} />
        </div>

        {/* Preview */}
        {form.whatsapp && (
          <div style={{ background:'#f0fdf4', borderRadius:12, padding:'14px 16px', marginBottom:20, border:'1.5px solid #bbf7d0' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#166534', marginBottom:6 }}>Aperçu du bouton WhatsApp :</div>
            <a href={`https://wa.me/${form.whatsapp}`} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#25d366', color:'#fff', padding:'10px 20px', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:15 }}>
              <span style={{ fontSize:20 }}>💬</span> Contacter sur WhatsApp
            </a>
          </div>
        )}

        {saved && <div style={{ background:'#d1fae5', color:'#065f46', padding:'10px 14px', borderRadius:10, marginBottom:14, fontSize:14, fontWeight:600 }}>✅ Sauvegardé !</div>}

        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'14px', background: saving ? '#93c5fd' : '#2563eb', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Sauvegarde...' : '💾 Enregistrer'}
        </button>
      </div>
    </div>
  );
}
