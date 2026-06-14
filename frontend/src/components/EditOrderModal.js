import React, { useState } from 'react';
import api from '../utils/api';

const CITIES = ['Casablanca','Rabat','Salé','Fès','Marrakech','Agadir','Tanger','Meknès','Oujda','Kenitra','Tétouan','Safi','Mohammédia','Khouribga','Béni Mellal','El Jadida','Nador','Taza','Settat','Berrechid','Khémisset','Inezgane','Ait Melloul','Larache','Ksar El Kebir','Guelmim','Dakhla','Laâyoune','Errachidia','Ouarzazate','Taroudant','Tiznit','Essaouira','Chefchaouen','Al Hoceima','Berkane','Taourirt','Azrou'].sort();

export default function EditOrderModal({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    client_name: order.client_name,
    phone: order.phone,
    address: order.address,
    city: order.city,
    notes: order.notes || '',
    price: order.price,
    quantity: order.quantity,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.client_name || !form.phone || !form.address || !form.city) return setError('Champs obligatoires manquants');
    setLoading(true);
    try {
      const res = await api.put(`/orders/${order.id}`, form);
      onSave(res.data);
      onClose();
    } catch(e) { setError(e.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const inp = { padding:'11px 14px', borderRadius:10, border:'2px solid #e5e7eb', fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
      <div style={{ position:'relative', background:'#fff', borderRadius:20, padding:'28px 32px', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', margin:16, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>✏️ Modifier la commande</h2>
            <div style={{ fontFamily:'monospace', fontSize:13, color:'#2563eb', marginTop:2 }}>{order.order_ref}</div>
          </div>
          <button onClick={onClose} style={{ background:'#f5f5f5', border:'none', borderRadius:10, width:36, height:36, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Nom client *</label>
            <input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} style={inp} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Téléphone *</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} type="tel" style={inp} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Adresse *</label>
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} style={inp} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Ville *</label>
            <select value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} style={{ ...inp, background:'#fff' }}>
              <option value="">-- Ville --</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Prix (DH)</label>
              <input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} type="number" style={inp} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Quantité</label>
              <input value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} type="number" min="1" style={inp} />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#666', marginBottom:5 }}>Notes</label>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes spéciales..." style={inp} />
          </div>
        </div>

        {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'10px 14px', borderRadius:10, marginTop:14, fontSize:14 }}>{error}</div>}

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', background:'#f5f5f5', border:'none', borderRadius:12, fontSize:15, cursor:'pointer', fontWeight:600 }}>Annuler</button>
          <button onClick={save} disabled={loading} style={{ flex:2, padding:'12px', background: loading?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            {loading ? 'Sauvegarde...' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
