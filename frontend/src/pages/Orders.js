import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const STATUS = ['confirmée','expédiée','livrée','annulée','retournée'];
const S_COLOR = {
  confirmée:  { bg:'#d1fae5', color:'#065f46' },
  expédiée:   { bg:'#dbeafe', color:'#1e40af' },
  livrée:     { bg:'#dcfce7', color:'#166534' },
  annulée:    { bg:'#fee2e2', color:'#991b1b' },
  retournée:  { bg:'#fef3c7', color:'#92400e' },
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date_from: today, date_to: today, status:'', search:'' });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k,v]) => v && params.append(k,v));
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
    await api.put(`/orders/${id}/status`, { status });
    setOrders(o => o.map(ord => ord.id === id ? { ...ord, status } : ord));
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/orders/${id}`);
    setOrders(o => o.filter(x => x.id !== id));
  };

  const total = orders.reduce((s,o) => s + o.price * o.quantity, 0);
  const inp = { padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:15, background:'#fff', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📋 Commandes</h2>
          <div style={{ fontSize:13, color:'#888', marginTop:2 }}>{orders.length} cmd · {total.toLocaleString()} DH</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowFilters(f=>!f)} style={{ padding:'9px 14px', background:'#fff', border:'1.5px solid #e0e0e0', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight: showFilters ? 700 : 400 }}>
            🔍 Filtres
          </button>
          <button onClick={() => navigate('/print', { state:{ filters } })} style={{ padding:'9px 14px', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600 }}>
            🖨️
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:12, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Du</div><input type="date" value={filters.date_from} onChange={e=>setFilters(f=>({...f,date_from:e.target.value}))} style={inp} /></div>
            <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Au</div><input type="date" value={filters.date_to} onChange={e=>setFilters(f=>({...f,date_to:e.target.value}))} style={inp} /></div>
          </div>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} style={inp}>
            <option value="">Tous les statuts</option>
            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Chercher nom, tél, ref..." value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} style={inp} />
          <button onClick={() => setFilters({ date_from:'', date_to:'', status:'', search:'' })} style={{ padding:'10px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontSize:14 }}>Réinitialiser</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Chargement...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
          <div style={{ fontSize:40 }}>📋</div>
          <div style={{ marginTop:8 }}>Aucune commande</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {orders.map(o => (
            <div key={o.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden' }}>
              <div onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#2563eb' }}>{o.order_ref}</span>
                    <span style={{ background:S_COLOR[o.status]?.bg||'#f0f0f0', color:S_COLOR[o.status]?.color||'#555', fontSize:11, padding:'2px 8px', borderRadius:99, fontWeight:600 }}>{o.status}</span>
                  </div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{o.client_name}</div>
                  <div style={{ fontSize:13, color:'#888' }}>{o.phone} · {o.city}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:800, fontSize:16, color:'#059669' }}>{o.price * o.quantity} DH</div>
                  <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{new Date(o.confirmed_at).toLocaleTimeString('fr-MA',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>

              {expanded === o.id && (
                <div style={{ borderTop:'1px solid #f0f0f0', padding:'12px 14px', background:'#fafafa' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                    {[
                      ['Produit', o.product_name + (o.size ? ` (${o.size})` : '')],
                      ['Prix', `${o.price} DH × ${o.quantity}`],
                      ['Adresse', o.address],
                      ['Support', o.support_name],
                    ].map(([k,v]) => (
                      <div key={k} style={{ background:'#fff', borderRadius:10, padding:'8px 10px' }}>
                        <div style={{ fontSize:11, color:'#aaa' }}>{k}</div>
                        <div style={{ fontSize:14, fontWeight:600, marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {o.notes && <div style={{ background:'#fffbeb', borderRadius:10, padding:'8px 10px', marginBottom:10, fontSize:13, color:'#92400e' }}>📝 {o.notes}</div>}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14, background:'#fff', cursor:'pointer' }}>
                      {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {user?.role === 'admin' && (
                      <button onClick={() => del(o.id)} style={{ padding:'10px 16px', background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600 }}>🗑️</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
