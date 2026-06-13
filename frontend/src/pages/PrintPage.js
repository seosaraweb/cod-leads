import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';

export default function PrintPage() {
  const location = useLocation();
  const printRef = useRef();
  const [orders, setOrders] = useState(location.state?.orders || []);
  const [loading, setLoading] = useState(!location.state?.orders);
  const [filters, setFilters] = useState(
    location.state?.filters || {
      date_from: new Date().toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      status: 'confirmée'
    }
  );
  const [labelSize, setLabelSize] = useState('normal');

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

  useEffect(() => {
    if (!location.state?.orders) load();
  }, []);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Colisage COD — ${filters.date_from}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; background: #fff; }
          .labels-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
          .label { border: 2px solid #000; padding: 12px 14px; page-break-inside: avoid; break-inside: avoid; min-height: ${labelSize === 'large' ? '200px' : '160px'}; display: flex; flex-direction: column; gap: 4px; }
          .label-ref { font-size: 11px; font-family: monospace; color: #333; font-weight: bold; }
          .label-product { font-size: ${labelSize === 'large' ? '16px' : '14px'}; font-weight: bold; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 6px; }
          .label-name { font-size: ${labelSize === 'large' ? '20px' : '18px'}; font-weight: 900; color: #000; }
          .label-phone { font-size: ${labelSize === 'large' ? '20px' : '18px'}; font-weight: 900; color: #000; letter-spacing: 1px; }
          .label-address { font-size: ${labelSize === 'large' ? '14px' : '13px'}; color: #333; margin-top: 4px; flex: 1; }
          .label-city { font-size: ${labelSize === 'large' ? '18px' : '16px'}; font-weight: 800; color: #000; text-transform: uppercase; }
          .label-price { font-size: ${labelSize === 'large' ? '20px' : '18px'}; font-weight: 900; color: #000; border-top: 1px solid #ddd; padding-top: 6px; margin-top: auto; }
          .label-qty { font-size: 13px; color: #555; }
          .label-support { font-size: 10px; color: #888; text-align: right; }
          .label-notes { font-size: 11px; color: #666; font-style: italic; }
          @media print {
            @page { size: A4; margin: 8mm; }
            .labels-grid { grid-template-columns: repeat(2, 1fr); }
          }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  const inp = { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, background: '#fff' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🖨️ Impression Colisage</h1>
          <p style={{ margin: '2px 0 0', color: '#888', fontSize: 14 }}>{orders.length} étiquettes à imprimer</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={labelSize} onChange={e => setLabelSize(e.target.value)} style={inp}>
            <option value="normal">Taille normale</option>
            <option value="large">Grande taille</option>
          </select>
          <button onClick={load} style={{ padding: '9px 16px', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>🔄 Actualiser</button>
          <button onClick={handlePrint} disabled={orders.length === 0}
            style={{ padding: '9px 20px', background: orders.length === 0 ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Imprimer {orders.length} étiquettes
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Du</div>
          <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} style={inp} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Au</div>
          <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} style={inp} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>Statut</div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={inp}>
            <option value="">Tous</option>
            <option value="confirmée">Confirmées</option>
            <option value="expédiée">Expédiées</option>
          </select>
        </div>
        <button onClick={load} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Charger
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', color: '#888' }}>Chargement...</div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖨️</div>
          <div style={{ fontWeight: 600 }}>Aucune commande à imprimer</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Modifiez les filtres et cliquez sur "Charger"</div>
        </div>
      ) : (
        <div>
          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Aperçu des étiquettes</h3>
            <div ref={printRef}>
              <div className="labels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
                {orders.map(o => (
                  <div key={o.id} className="label" style={{
                    border: '2px solid #000', padding: '12px 14px', minHeight: labelSize === 'large' ? 200 : 160,
                    display: 'flex', flexDirection: 'column', gap: 3, pageBreakInside: 'avoid'
                  }}>
                    <div className="label-ref" style={{ fontSize: 11, fontFamily: 'monospace', color: '#333', fontWeight: 'bold' }}>
                      {o.order_ref} — {new Date(o.confirmed_at).toLocaleDateString('fr-MA')}
                    </div>
                    <div className="label-product" style={{ fontSize: labelSize === 'large' ? 16 : 14, fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: 6, marginBottom: 4 }}>
                      {o.product_name}{o.quantity > 1 ? ` ×${o.quantity}` : ''}
                      {o.notes ? ` — ${o.notes}` : ''}
                    </div>
                    <div className="label-name" style={{ fontSize: labelSize === 'large' ? 20 : 18, fontWeight: 900 }}>{o.client_name}</div>
                    <div className="label-phone" style={{ fontSize: labelSize === 'large' ? 20 : 18, fontWeight: 900, letterSpacing: 1 }}>{o.phone}</div>
                    <div className="label-address" style={{ fontSize: labelSize === 'large' ? 14 : 13, color: '#333', flex: 1, marginTop: 4 }}>{o.address}</div>
                    <div className="label-city" style={{ fontSize: labelSize === 'large' ? 18 : 16, fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>{o.city}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ddd', paddingTop: 6, marginTop: 4 }}>
                      <div className="label-price" style={{ fontSize: labelSize === 'large' ? 20 : 18, fontWeight: 900 }}>
                        💰 {o.price * o.quantity} DH (COD)
                      </div>
                      <div className="label-support" style={{ fontSize: 10, color: '#888' }}>{o.support_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
