import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const STATUS_OPTIONS = ['confirmée','expédiée','livrée','annulée','retournée'];
const STATUS_COLORS = {
  confirmée: { bg: '#d1fae5', color: '#065f46' },
  expédiée:  { bg: '#dbeafe', color: '#1e40af' },
  livrée:    { bg: '#dcfce7', color: '#166534' },
  annulée:   { bg: '#fee2e2', color: '#991b1b' },
  retournée: { bg: '#fef3c7', color: '#92400e' }
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    support_id: '', city: '', status: '', search: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get('/orders?' + params);
      setOrders(res.data);
    } catch {}
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.role === 'admin') api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(o => o.map(ord => ord.id === id ? { ...ord, status } : ord));
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    await api.delete(`/orders/${id}`);
    setOrders(o => o.filter(ord => ord.id !== id));
  };

  const exportCSV = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const token = localStorage.getItem('token');
    const url = `${process.env.REACT_APP_API_URL || ''}/api/export/csv?${params}&token=${token}`;
    window.open(url.replace('?token=', `?auth=${token}&`));
    const a = document.createElement('a');
    a.href = `${process.env.REACT_APP_API_URL || ''}/api/export/csv?${params}`;
    a.click();
  };

  const inp = { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, background: '#fff' };
  const total = orders.reduce((s, o) => s + (o.price * o.quantity), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📋 Commandes</h1>
          <p style={{ margin: '2px 0 0', color: '#888', fontSize: 14 }}>{orders.length} commandes • {total.toLocaleString()} DH</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/print', { state: { orders, filters } })}
            style={{ padding: '9px 18px', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            🖨️ Imprimer
          </button>
          <button onClick={exportCSV}
            style={{ padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            ⬇️ Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Du</div>
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} style={inp} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Au</div>
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} style={inp} />
        </div>
        {user?.role === 'admin' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Support</div>
            <select value={filters.support_id} onChange={e => setFilters(f => ({ ...f, support_id: e.target.value }))} style={inp}>
              <option value="">Tous</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
        )}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Statut</div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={inp}>
            <option value="">Tous</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Ville</div>
          <input placeholder="Casablanca..." value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} style={{ ...inp, width: 120 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Recherche</div>
          <input placeholder="Nom, téléphone, référence..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ ...inp, width: '100%' }} />
        </div>
        <button onClick={() => setFilters({ date_from: '', date_to: '', support_id: '', city: '', status: '', search: '' })}
          style={{ padding: '8px 16px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Réinitialiser
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Aucune commande trouvée</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '1.5px solid #f0f0f0' }}>
                {['Réf', 'Produit', 'Client', 'Téléphone', 'Ville', 'Prix', 'Statut', user?.role === 'admin' && 'Support', 'Date', 'Actions'].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap' }}>{o.order_ref}</td>
                  <td style={{ padding: '11px 16px', maxWidth: 140 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</div>
                    {o.notes && <div style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.notes}</div>}
                  </td>
                  <td style={{ padding: '11px 16px', fontWeight: 500 }}>{o.client_name}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 13 }}>{o.phone}</td>
                  <td style={{ padding: '11px 16px' }}>{o.city}</td>
                  <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700 }}>{o.price} DH</span>
                    {o.quantity > 1 && <span style={{ color: '#888', fontSize: 12 }}> ×{o.quantity}</span>}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      style={{ background: STATUS_COLORS[o.status]?.bg || '#f0f0f0', color: STATUS_COLORS[o.status]?.color || '#555', border: 'none', padding: '4px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {user?.role === 'admin' && <td style={{ padding: '11px 16px', color: '#888', fontSize: 13 }}>{o.support_name}</td>}
                  <td style={{ padding: '11px 16px', whiteSpace: 'nowrap', color: '#888', fontSize: 12 }}>
                    {new Date(o.confirmed_at).toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    {user?.role === 'admin' && (
                      <button onClick={() => deleteOrder(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ccc' }} title="Supprimer">🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
