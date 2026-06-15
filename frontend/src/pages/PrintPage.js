import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';

export default function PrintPage() {
  const location = useLocation();
  const printRef = useRef();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState(location.state?.filters || { date_from: today, date_to: today, status:'confirmée' });

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

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Colisage</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;background:#fff}
      .grid{display:grid;grid-template-columns:repeat(2,1fr)}
      .label{border:2px solid #000;padding:12px;min-height:170px;display:flex;flex-direction:column;gap:3px;page-break-inside:avoid;break-inside:avoid}
      .ref{font-size:10px;font-family:monospace;color:#333;font-weight:bold}
      .prod{font-size:13px;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:5px;margin-bottom:5px}
      .name{font-size:20px;font-weight:900}
      .phone{font-size:20px;font-weight:900;letter-spacing:1px}
      .addr{font-size:12px;color:#333;flex:1;margin-top:3px}
      .city{font-size:17px;font-weight:900;text-transform:uppercase;margin-top:4px}
      .price{font-size:20px;font-weight:900;border-top:1px solid #ddd;padding-top:6px;margin-top:auto}
      .sup{font-size:10px;color:#888;text-align:right}
      @media print{@page{size:A4;margin:6mm}}
    </style></head><body><div class="grid">${printRef.current.innerHTML}</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const exportXLSX = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => v && params.append(k,v));
    const token = localStorage.getItem('token');
    params.append('token', token);
    const a = document.createElement('a');
    a.href = `${process.env.REACT_APP_API_URL||''}/api/export/xlsx?${params}`;
    a.download = `colis_${filters.date_from||'all'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const inp = { padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:15, background:'#fff', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>🖨️ Colisage</h2>
          <div style={{ fontSize:13, color:'#888', marginTop:2 }}>{orders.length} étiquettes</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportXLSX} style={{ padding:'9px 16px', background:'#059669', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600 }}>⬇️ Excel WDV</button>
          <button onClick={handlePrint} disabled={orders.length===0}
            style={{ padding:'9px 14px', background: orders.length===0?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:700 }}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Du</div><input type="date" value={filters.date_from} onChange={e=>setFilters(f=>({...f,date_from:e.target.value}))} style={inp} /></div>
          <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Au</div><input type="date" value={filters.date_to} onChange={e=>setFilters(f=>({...f,date_to:e.target.value}))} style={inp} /></div>
        </div>
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} style={inp}>
          <option value="">Tous statuts</option>
          <option value="confirmée">Confirmées</option>
          <option value="expédiée">Expédiées</option>
        </select>
        <button onClick={load} style={{ padding:'12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:15, fontWeight:700 }}>Charger les étiquettes</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Chargement...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
          <div style={{ fontSize:40 }}>🖨️</div>
          <div style={{ marginTop:8 }}>Aucune commande à imprimer</div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, padding:'14px' }}>
          <div ref={printRef} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
            {orders.map(o => (
              <div key={o.id} className="label" style={{ border:'2px solid #000', padding:'10px 12px', minHeight:170, display:'flex', flexDirection:'column', gap:3, pageBreakInside:'avoid' }}>
                <div style={{ fontSize:10, fontFamily:'monospace', fontWeight:'bold', color:'#333' }}>{o.order_ref} — {new Date(o.confirmed_at).toLocaleDateString('fr-MA')}</div>
                <div style={{ fontSize:13, fontWeight:'bold', borderBottom:'1px solid #ddd', paddingBottom:4, marginBottom:4 }}>
                  {o.product_name}{o.size ? ` (${o.size})` : ''}{o.quantity > 1 ? ` ×${o.quantity}` : ''}
                  {o.notes ? ` — ${o.notes}` : ''}
                </div>
                <div style={{ fontSize:20, fontWeight:900 }}>{o.client_name}</div>
                <div style={{ fontSize:20, fontWeight:900, letterSpacing:1 }}>{o.phone}</div>
                <div style={{ fontSize:12, color:'#333', flex:1, marginTop:3 }}>{o.address}</div>
                <div style={{ fontSize:17, fontWeight:900, textTransform:'uppercase', marginTop:4 }}>{o.city}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #ddd', paddingTop:5, marginTop:'auto' }}>
                  <div style={{ fontSize:20, fontWeight:900 }}>💰 {o.price * o.quantity} DH (COD)</div>
                  <div style={{ fontSize:10, color:'#888' }}>{o.support_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
