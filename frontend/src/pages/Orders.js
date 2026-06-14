import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';
import EditOrderModal from '../components/EditOrderModal';
import { useAuth } from '../utils/AuthContext';

const STATUS = ['confirmée','expédiée','livrée','annulée','retournée'];
const S_COLOR = {
  confirmée:  { bg:'#d1fae5', color:'#065f46' },
  expédiée:   { bg:'#dbeafe', color:'#1e40af' },
  livrée:     { bg:'#dcfce7', color:'#166534' },
  annulée:    { bg:'#fee2e2', color:'#991b1b' },
  retournée:  { bg:'#fef3c7', color:'#92400e' },
};
const imgUrl = (filename) => filename ? getImageUrl(`/uploads/${filename}`) : null;

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date_from:today, date_to:today, status:'', search:'', support_id:'' });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k,v]) => v && params.append(k,v));
      setOrders((await api.get('/orders?'+params)).data);
    } catch {}
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user?.role==='admin') api.get('/users').then(r=>setUsers(r.data)).catch(()=>{});
  }, [user]);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    setOrders(o => o.map(ord => ord.id===id ? {...ord,status} : ord));
  };

  const onSave = (updated) => {
    setOrders(o => o.map(ord => ord.id === updated.id ? updated : ord));
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/orders/${id}`);
    setOrders(o => o.filter(x => x.id!==id));
  };

  const exportCSV = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => v && params.append(k,v));
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL||''}/api/export/csv?${params}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.blob()).then(blob => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'commandes.csv'; a.click();
      });
  };

  const total = orders.reduce((s,o) => s+o.price*o.quantity, 0);
  const inp = { padding:'9px 12px', borderRadius:9, border:'1.5px solid #e0e0e0', fontSize:14, background:'#fff', outline:'none' };

  // Get first image from order (stored as product image filename via variant or product)
  const getOrderThumb = (o) => {
    // Orders store product_image as a path like /uploads/filename or just filename
    if (!o.product_image) return null;
    const filename = o.product_image.replace('/uploads/', '');
    return imgUrl(filename);
  };

  return (
    <>
      <style>{`
        .orders-table { display: table; width: 100%; border-collapse: collapse; }
        .orders-cards { display: none; }
        @media (max-width: 768px) {
          .orders-table { display: none; }
          .orders-cards { display: flex; flex-direction: column; gap: 8px; }
        }
        .order-row:hover { background: #fafafa; }
      `}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>📋 Commandes</h1>
          <p style={{ margin:'2px 0 0', color:'#888', fontSize:14 }}>{orders.length} commandes · {total.toLocaleString()} DH</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>setShowFilters(f=>!f)} style={{ padding:'9px 16px', background: showFilters?'#eff6ff':'#fff', border:'1.5px solid #e0e0e0', borderRadius:9, cursor:'pointer', fontSize:14, color: showFilters?'#2563eb':'inherit', fontWeight: showFilters?600:400 }}>🔍 Filtres</button>
          <button onClick={exportCSV} style={{ padding:'9px 16px', background:'#fff', border:'1.5px solid #e0e0e0', borderRadius:9, cursor:'pointer', fontSize:14 }}>⬇️ CSV</button>
          <button onClick={()=>navigate('/print',{state:{filters}})} style={{ padding:'9px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:9, cursor:'pointer', fontSize:14, fontWeight:600 }}>🖨️ Imprimer</button>
        </div>
      </div>

      {showFilters && (
        <div style={{ background:'#fff', borderRadius:14, padding:'16px', marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Du</div><input type="date" value={filters.date_from} onChange={e=>setFilters(f=>({...f,date_from:e.target.value}))} style={inp} /></div>
          <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Au</div><input type="date" value={filters.date_to} onChange={e=>setFilters(f=>({...f,date_to:e.target.value}))} style={inp} /></div>
          <div>
            <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Statut</div>
            <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} style={inp}>
              <option value="">Tous</option>{STATUS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {user?.role==='admin' && (
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Support</div>
              <select value={filters.support_id} onChange={e=>setFilters(f=>({...f,support_id:e.target.value}))} style={inp}>
                <option value="">Tous</option>{users.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Recherche</div>
            <input placeholder="Nom, tél, référence..." value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
          </div>
          <button onClick={()=>setFilters({date_from:'',date_to:'',status:'',search:'',support_id:''})} style={{ padding:'9px 16px', background:'#f5f5f5', border:'1.5px solid #e0e0e0', borderRadius:9, cursor:'pointer', fontSize:14 }}>Reset</button>
        </div>
      )}

      {loading ? <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Chargement...</div> : orders.length===0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#aaa', background:'#fff', borderRadius:14 }}>
          <div style={{ fontSize:48 }}>📋</div><div style={{ marginTop:12, fontWeight:600 }}>Aucune commande</div>
        </div>
      ) : (
        <>
          {/* ── PC TABLE ── */}
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <table className="orders-table">
              <thead>
                <tr style={{ background:'#f9f9f9', borderBottom:'2px solid #f0f0f0' }}>
                  {[
                    { label:'', w:52 },
                    { label:'Réf', w:160 },
                    { label:'Produit / Variante', w:'auto' },
                    { label:'Client', w:140 },
                    { label:'Téléphone', w:120 },
                    { label:'Ville', w:110 },
                    { label:'Prix', w:90 },
                    { label:'Statut', w:130 },
                    ...(user?.role==='admin' ? [{ label:'Support', w:110 }] : []),
                    { label:'Heure', w:60 },
                    { label:'', w:40 },
                  ].map(h=>(
                    <th key={h.label} style={{ padding:'11px 12px', textAlign:'left', fontWeight:600, color:'#666', fontSize:12, whiteSpace:'nowrap', width:h.w }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const thumb = getOrderThumb(o);
                  return (
                    <tr key={o.id} className="order-row" style={{ borderBottom:'1px solid #f5f5f5', transition:'background 0.1s' }}>
                      {/* Thumbnail */}
                      <td style={{ padding:'8px 8px 8px 12px', width:52 }}>
                        <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#f0f0f0', flexShrink:0 }}>
                          {thumb
                            ? <img src={thumb} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📦</div>}
                        </div>
                      </td>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#2563eb', whiteSpace:'nowrap' }}>{o.order_ref}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:200 }}>{o.product_name}</div>
                        <div style={{ display:'flex', gap:4, marginTop:3, flexWrap:'wrap' }}>
                          {o.variant_label && <span style={{ background:'#2563eb', color:'#fff', fontSize:11, padding:'2px 8px', borderRadius:99, fontWeight:700, whiteSpace:'nowrap' }}>{o.variant_label}</span>}
                          {o.notes && <span style={{ background:'#fef3c7', color:'#92400e', fontSize:11, padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>{o.notes}</span>}
                        </div>
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:600, fontSize:14, whiteSpace:'nowrap' }}>{o.client_name}</td>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', fontSize:13, whiteSpace:'nowrap' }}>{o.phone}</td>
                      <td style={{ padding:'8px 12px', fontSize:14, whiteSpace:'nowrap' }}>{o.city}</td>
                      <td style={{ padding:'8px 12px', whiteSpace:'nowrap' }}>
                        <span style={{ fontWeight:700, fontSize:15 }}>{o.price*o.quantity}</span>
                        <span style={{ color:'#aaa', fontSize:12 }}> DH{o.quantity>1?` ×${o.quantity}`:''}</span>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}
                          style={{ background:S_COLOR[o.status]?.bg||'#f0f0f0', color:S_COLOR[o.status]?.color||'#555', border:'none', padding:'5px 10px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          {STATUS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      {user?.role==='admin' && <td style={{ padding:'8px 12px', color:'#888', fontSize:13 }}>{o.support_name}</td>}
                      <td style={{ padding:'8px 12px', color:'#aaa', fontSize:12, whiteSpace:'nowrap' }}>
                        {new Date(o.confirmed_at).toLocaleTimeString('fr-MA',{hour:'2-digit',minute:'2-digit'})}
                      </td>
                      <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                        <button onClick={()=>setEditingOrder(o)} style={{ background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:13, fontWeight:600, marginRight:4 }}>✏️</button>
                        {user?.role==='admin' && <button onClick={()=>del(o.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#e0e0e0', padding:4 }} title="Supprimer">🗑️</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="orders-cards">
            {orders.map(o => {
              const thumb = getOrderThumb(o);
              return (
                <div key={o.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden' }}>
                  <div onClick={()=>setExpanded(expanded===o.id?null:o.id)} style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                    {/* thumb */}
                    <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', background:'#f0f0f0', flexShrink:0 }}>
                      {thumb ? <img src={thumb} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                             : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📦</div>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#2563eb' }}>{o.order_ref}</span>
                        <span style={{ background:S_COLOR[o.status]?.bg, color:S_COLOR[o.status]?.color, fontSize:11, padding:'3px 10px', borderRadius:99, fontWeight:700 }}>{o.status}</span>
                        {o.variant_label && <span style={{ background:'#2563eb', color:'#fff', fontSize:12, padding:'3px 10px', borderRadius:99, fontWeight:700 }}>{o.variant_label}</span>}
                      </div>
                      <div style={{ fontWeight:700, fontSize:15 }}>{o.client_name}</div>
                      <div style={{ fontSize:13, color:'#888' }}>{o.phone} · {o.city}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:800, fontSize:16, color:'#059669' }}>{o.price*o.quantity} DH</div>
                      <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{new Date(o.confirmed_at).toLocaleTimeString('fr-MA',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                  {expanded===o.id && (
                    <div style={{ borderTop:'1px solid #f0f0f0', padding:'12px 14px', background:'#fafafa' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                        {[['Produit',o.product_name+(o.variant_label?` — ${o.variant_label}`:'')+(o.quantity>1?` ×${o.quantity}`:'')],['Support',o.support_name],['Adresse',o.address+', '+o.city]].map(([k,v])=>(
                          <div key={k} style={{ background:'#fff', borderRadius:10, padding:'8px 10px' }}>
                            <div style={{ fontSize:11, color:'#aaa' }}>{k}</div>
                            <div style={{ fontSize:13, fontWeight:600, marginTop:1 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={()=>setEditingOrder(o)} style={{ padding:'10px 14px', background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:14 }}>✏️ Modifier</button>
                        <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14, background:'#fff' }}>
                          {STATUS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        {user?.role==='admin' && <button onClick={()=>del(o.id)} style={{ padding:'10px 14px', background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:10, cursor:'pointer' }}>🗑️</button>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      {editingOrder && <EditOrderModal order={editingOrder} onClose={()=>setEditingOrder(null)} onSave={onSave} />}
    </>
  );
}
