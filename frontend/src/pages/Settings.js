import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Settings() {
  const [numbers, setNumbers] = useState(['']);
  const [shopName, setShopName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    api.get('/settings').then(r => {
      const d = r.data;
      setShopName(d.shop_name || '');
      setCounter(parseInt(d.whatsapp_counter || '0'));
      try {
        const nums = JSON.parse(d.whatsapp_numbers || '[""]');
        setNumbers(nums.length ? nums : ['']);
      } catch { setNumbers(['']); }
    }).catch(() => {});
  }, []);

  const addNumber = () => setNumbers(n => [...n, '']);
  const removeNumber = (i) => setNumbers(n => n.filter((_, idx) => idx !== i));
  const updateNumber = (i, val) => setNumbers(n => n.map((v, idx) => idx === i ? val : v));

  const save = async () => {
    setSaving(true);
    const cleaned = numbers.filter(n => n.trim());
    await api.put('/settings', {
      shop_name: shopName,
      whatsapp_numbers: JSON.stringify(cleaned),
      // Reset counter on save to restart rotation
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = { padding:'12px 16px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

  const activeIdx = counter % Math.max(numbers.filter(n=>n.trim()).length, 1);

  return (
    <div>
      <h1 style={{ margin:'0 0 24px', fontSize:22, fontWeight:800 }}>⚙️ Paramètres</h1>

      <div style={{ background:'#fff', borderRadius:16, padding:'24px', maxWidth:560 }}>

        {/* Shop name */}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#555', marginBottom:6 }}>🏪 Nom de la boutique</label>
          <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Ex: Lili Discount" style={inp} />
        </div>

        {/* WhatsApp numbers */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <label style={{ fontSize:13, fontWeight:700, color:'#555' }}>📱 Numéros WhatsApp (rotation FIFO)</label>
            <button onClick={addNumber} style={{ padding:'6px 14px', background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>+ Ajouter</button>
          </div>

          <div style={{ fontSize:12, color:'#aaa', marginBottom:12 }}>
            Les commandes sont distribuées en rotation : commande 1 → n°1, commande 2 → n°2, commande 3 → n°1...
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {numbers.map((num, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background: i === activeIdx && num.trim() ? '#d1fae5' : '#f0f0f0', color: i === activeIdx && num.trim() ? '#065f46' : '#aaa', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {i + 1}
                </div>
                <div style={{ position:'relative', flex:1 }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:13, fontWeight:600 }}>+</span>
                  <input value={num} onChange={e => updateNumber(i, e.target.value)}
                    placeholder="212XXXXXXXXX" type="tel"
                    style={{ ...inp, paddingLeft:28 }} />
                </div>
                {i === activeIdx && num.trim() && (
                  <span style={{ background:'#d1fae5', color:'#065f46', fontSize:11, padding:'3px 8px', borderRadius:99, fontWeight:700, flexShrink:0 }}>Actuel</span>
                )}
                {numbers.length > 1 && (
                  <button onClick={() => removeNumber(i)} style={{ width:32, height:32, background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:8, cursor:'pointer', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                )}
              </div>
            ))}
          </div>

          {numbers.filter(n=>n.trim()).length > 1 && (
            <div style={{ marginTop:12, background:'#eff6ff', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#1e40af' }}>
              <strong>Rotation actuelle :</strong> {numbers.filter(n=>n.trim()).map((n,i) => (
                <span key={i} style={{ marginLeft:4 }}>
                  <span style={{ background: i===activeIdx?'#2563eb':'#dbeafe', color: i===activeIdx?'#fff':'#1e40af', padding:'2px 8px', borderRadius:99, fontSize:12, fontWeight:700 }}>+{n}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {saved && <div style={{ background:'#d1fae5', color:'#065f46', padding:'10px 14px', borderRadius:10, marginBottom:14, fontSize:14, fontWeight:600 }}>✅ Paramètres sauvegardés !</div>}

        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'14px', background: saving?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Sauvegarde...' : '💾 Enregistrer'}
        </button>
      </div>
    </div>
  );
}
