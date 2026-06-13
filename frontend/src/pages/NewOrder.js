import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const MOROCCO_CITIES = [
  'Casablanca','Rabat','Salé','Fès','Marrakech','Agadir','Tanger','Meknès',
  'Oujda','Kenitra','Tétouan','Safi','Mohammédia','Khouribga','Béni Mellal',
  'El Jadida','Nador','Taza','Settat','Berrechid','Khémisset','Inezgane',
  'Ait Melloul','Larache','Ksar El Kebir','Guelmim','Dakhla','Laâyoune',
  'Errachidia','Ouarzazate','Taroudant','Tiznit','Essaouira','Chefchaouen',
  'Ifrane','Al Hoceima','Berkane','Taourirt','Figuig','Azrou'
].sort();

const STATUS_COLORS = {
  confirmée: '#d1fae5',
  expédiée: '#dbeafe',
  livrée: '#d1fae5',
  annulée: '#fee2e2',
  retournée: '#fef3c7'
};

export default function NewOrder() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_id: '', product_name: '', client_name: '', phone: '',
    address: '', city: '', price: '', quantity: 1, notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
    loadRecent();
  }, []);

  const loadRecent = () => {
    api.get('/orders?').then(r => setRecentOrders(r.data.slice(0, 5))).catch(() => {});
  };

  const handleProductChange = (e) => {
    const id = e.target.value;
    const prod = products.find(p => p.id == id);
    setForm(f => ({ ...f, product_id: id, product_name: prod?.name || '', price: prod?.price || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', form);
      setSuccess(res.data);
      setForm({ product_id: '', product_name: '', client_name: '', phone: '', address: '', city: '', price: '', quantity: 1, notes: '' });
      loadRecent();
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  const inp = { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Nouvelle Commande</h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>Confirmation client COD — {user?.username}</p>
      </div>

      {success && (
        <div style={{ background: '#d1fae5', border: '1.5px solid #6ee7b7', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#065f46' }}>Commande confirmée !</span>
            <span style={{ marginLeft: 'auto', background: '#fff', padding: '4px 12px', borderRadius: 99, fontWeight: 700, fontSize: 13, color: '#065f46', fontFamily: 'monospace' }}>{success.order_ref}</span>
          </div>
          <div style={{ fontSize: 14, color: '#065f46', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            <span>👤 {success.client_name}</span>
            <span>📱 {success.phone}</span>
            <span>📍 {success.city}</span>
            <span>💰 {success.price} DH × {success.quantity}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* FORM */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            {/* Product */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Produit *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={form.product_id} onChange={handleProductChange}
                  style={{ ...inp, background: '#fff' }}>
                  <option value="">-- Choisir un produit --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price} DH</option>)}
                </select>
                <input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="Ou saisir manuellement" style={inp} />
              </div>
            </div>

            {/* Client info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Nom client *</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  placeholder="Prénom Nom" required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Téléphone *</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="06XXXXXXXX" required style={inp} type="tel" />
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Adresse complète *</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="N° rue, quartier, résidence..." required
                rows={2} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* City + Price + Qty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Ville *</label>
                <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  required style={{ ...inp, background: '#fff' }}>
                  <option value="">-- Ville --</option>
                  {MOROCCO_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Prix (DH)</label>
                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0" type="number" min="0" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Qté</label>
                <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  type="number" min="1" style={inp} />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444' }}>Notes (optionnel)</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Instructions spéciales, couleur, taille..." style={inp} />
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', letterSpacing: 0.3
            }}>
              {loading ? '⏳ Confirmation...' : '✅ Confirmer la commande'}
            </button>
          </form>
        </div>

        {/* Recent orders sidebar */}
        <div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>🕐 Mes dernières commandes</h3>
            {recentOrders.length === 0 && <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>Aucune commande encore</p>}
            {recentOrders.map(o => (
              <div key={o.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{o.order_ref}</span>
                  <span style={{ background: STATUS_COLORS[o.status] || '#f0f0f0', fontSize: 11, padding: '2px 8px', borderRadius: 99, color: '#555' }}>{o.status}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{o.client_name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{o.phone} • {o.city}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{o.product_name} — {o.price} DH</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
