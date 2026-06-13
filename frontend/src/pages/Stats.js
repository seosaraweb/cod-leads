import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.get(`/orders/stats?date=${date}`).then(r => setStats(r.data)).catch(() => {});
  }, [date]);

  const card = (label, value, color = '#2563eb') => (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📊 Statistiques</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14 }} />
      </div>

      {!stats ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Chargement...</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {card('Commandes aujourd\'hui', stats.todayCount, '#2563eb')}
            {card('Total commandes', stats.totalCount, '#059669')}
            {card('Supports actifs aujourd\'hui', stats.todayBySupport.length, '#7c3aed')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* By support */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>👥 Confirmations par support</h3>
              {stats.todayBySupport.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: 14 }}>Aucune commande ce jour</p>
              ) : stats.todayBySupport.map((s, i) => (
                <div key={s.support_name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.support_name}</div>
                    <div style={{ background: '#e0e7ff', height: 6, borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ background: '#2563eb', height: '100%', width: `${(s.count / stats.todayBySupport[0].count) * 100}%`, borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#2563eb' }}>{s.count}</div>
                </div>
              ))}
            </div>

            {/* By city */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>🗺️ Top villes aujourd'hui</h3>
              {stats.todayByCity.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: 14 }}>Aucune commande ce jour</p>
              ) : stats.todayByCity.map((c, i) => (
                <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, fontSize: 13, color: '#aaa', fontWeight: 700 }}>{i+1}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.city}</div>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{c.count}</div>
                </div>
              ))}
            </div>

            {/* By status */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>📦 Total par statut</h3>
              {[
                { s: 'confirmée', color: '#059669', bg: '#d1fae5' },
                { s: 'expédiée', color: '#1e40af', bg: '#dbeafe' },
                { s: 'livrée', color: '#166534', bg: '#dcfce7' },
                { s: 'annulée', color: '#991b1b', bg: '#fee2e2' },
                { s: 'retournée', color: '#92400e', bg: '#fef3c7' },
              ].map(({ s, color, bg }) => {
                const found = stats.totalByStatus.find(x => x.status === s);
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: bg, borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color }}>{s}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color }}>{found?.count || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
