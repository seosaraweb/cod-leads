import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/products/all').then(r => setProducts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return;
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/products/${editing}`, { ...form, active: true });
      } else {
        await api.post('/products', form);
      }
      setForm({ name: '', price: '' });
      setEditing(null);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const toggleActive = async (p) => {
    await api.put(`/products/${p.id}`, { ...p, active: !p.active });
    load();
  };

  const inp = { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, background: '#fff' };

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>📦 Produits</h1>

      {/* Add/Edit form */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{editing ? '✏️ Modifier le produit' : '➕ Nouveau produit'}</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#555' }}>Nom du produit</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Ceinture Chauffante XL" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ width: 160 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#555' }}>Prix (DH)</label>
            <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" min="0" placeholder="0" style={inp} />
          </div>
          <button onClick={save} disabled={loading || !form.name}
            style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', price: '' }); }}
              style={{ padding: '10px 16px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '1.5px solid #f0f0f0' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Produit</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Prix</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Statut</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: p.active ? 1 : 0.5 }}>
                <td style={{ padding: '12px 20px', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '12px 20px', fontWeight: 700 }}>{p.price} DH</td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{ background: p.active ? '#d1fae5' : '#f3f4f6', color: p.active ? '#065f46' : '#888', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {p.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditing(p.id); setForm({ name: p.name, price: p.price }); }}
                    style={{ padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    ✏️ Modifier
                  </button>
                  <button onClick={() => toggleActive(p)}
                    style={{ padding: '6px 14px', background: p.active ? '#fff7ed' : '#f0fdf4', color: p.active ? '#ea580c' : '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    {p.active ? '⏸️ Désactiver' : '▶️ Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Aucun produit encore</div>}
      </div>
    </div>
  );
}
