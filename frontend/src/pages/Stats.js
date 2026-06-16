import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const S_COLOR = {
  'confirmée':  '#059669',
  'en attente': '#f59e0b',
  'expédiée':   '#2563eb',
  'livrée':     '#16a34a',
  'annulée':    '#dc2626',
  'retournée':  '#92400e',
};

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.get(`/orders/stats?date=${date}`).then(r => setStats(r.data)).catch(() => {});
  }, [date]);

  if (!stats) return <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Chargement...</div>;

  const maxHour = Math.max(...(stats.byHour?.map(h => h.count) || [1]));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>📊 Statistiques</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding:'9px 14px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14 }} />
      </div>

      {/* KPIs principaux */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:"Commandes aujourd'hui", val: stats.todayCount, color:'#2563eb', bg:'#eff6ff', icon:'📋' },
          { label:'Chiffre d\'affaires', val: `${(stats.todayRevenue||0).toLocaleString()} DH`, color:'#059669', bg:'#f0fdf4', icon:'💰' },
          { label:'Taux confirmation', val: `${stats.confirmationRate}%`, color:'#7c3aed', bg:'#f5f3ff', icon:'✅' },
          { label:'Total commandes', val: stats.totalCount, color:'#ea580c', bg:'#fff7ed', icon:'📦' },
          { label:'CA total', val: `${(stats.totalRevenue||0).toLocaleString()} DH`, color:'#0891b2', bg:'#ecfeff', icon:'🏆' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:14, padding:'16px 14px' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:11, color:k.color, fontWeight:600, marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:900, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Statuts du jour */}
      <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>📊 Statuts aujourd'hui</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8 }}>
          {stats.totalByStatus.filter(s => {
            const todayStatuses = stats.todayBySupport.flatMap(sup => sup.statuses || []);
            return todayStatuses.some(x => x.status === s.status) || true;
          }).map(s => (
            <div key={s.status} style={{ background:'#f9f9f9', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>{s.status}</div>
              <div style={{ fontSize:22, fontWeight:900, color: S_COLOR[s.status]||'#555' }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commandes par heure */}
      {stats.byHour?.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>🕐 Commandes par heure</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
            {Array.from({length:24}, (_, h) => {
              const found = stats.byHour.find(x => parseInt(x.hour) === h);
              const count = found?.count || 0;
              const pct = maxHour > 0 ? (count / maxHour) * 100 : 0;
              return (
                <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ fontSize:9, color:'#aaa' }}>{count > 0 ? count : ''}</div>
                  <div style={{ width:'100%', background: count > 0 ? '#2563eb' : '#f0f0f0', borderRadius:3, height:`${Math.max(pct, count>0?8:4)}%`, minHeight:4, transition:'height 0.3s' }} />
                  <div style={{ fontSize:9, color:'#aaa' }}>{h}h</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:16 }}>
        {/* Par support avec détail */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>👥 Détail par support</div>
          {stats.todayBySupport.length === 0 ? (
            <div style={{ color:'#aaa', fontSize:14 }}>Aucune commande ce jour</div>
          ) : stats.todayBySupport.map((s, i) => (
            <div key={s.support_name} style={{ marginBottom:14, paddingBottom:14, borderBottom: i < stats.todayBySupport.length-1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'#2563eb' }}>{i+1}</div>
                  <span style={{ fontWeight:700, fontSize:15 }}>{s.support_name}</span>
                </div>
                <span style={{ fontWeight:900, fontSize:20, color:'#2563eb' }}>{s.count}</span>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {s.statuses?.map(st => (
                  <span key={st.status} style={{ fontSize:12, padding:'3px 10px', borderRadius:99, background:'#f0f0f0', color: S_COLOR[st.status]||'#555', fontWeight:700 }}>
                    {st.status} · {st.count}
                    {st.revenue > 0 && <span style={{ color:'#888', fontWeight:400 }}> ({Math.round(st.revenue).toLocaleString()} DH)</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Top produits */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>🔥 Top produits aujourd'hui</div>
          {stats.topProducts?.length === 0 ? (
            <div style={{ color:'#aaa', fontSize:14 }}>Aucune commande ce jour</div>
          ) : stats.topProducts?.map((p, i) => (
            <div key={p.product_name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background: i===0?'#fef3c7':i===1?'#f3f4f6':'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: i===0?'#92400e':'#888', flexShrink:0 }}>
                {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</div>
                <div style={{ fontSize:12, color:'#888' }}>{Math.round(p.revenue||0).toLocaleString()} DH</div>
              </div>
              <div style={{ fontWeight:800, fontSize:18, color:'#2563eb', flexShrink:0 }}>{p.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top villes */}
      <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>🗺️ Top villes aujourd'hui</div>
        {stats.todayByCity.length === 0 ? (
          <div style={{ color:'#aaa', fontSize:14 }}>Aucune commande ce jour</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:8 }}>
            {stats.todayByCity.map((c, i) => (
              <div key={c.city} style={{ display:'flex', alignItems:'center', gap:8, background:'#f9f9f9', borderRadius:10, padding:'8px 12px' }}>
                <span style={{ fontSize:13, color:'#aaa', fontWeight:700, minWidth:20 }}>{i+1}</span>
                <span style={{ flex:1, fontSize:14, fontWeight:500 }}>{c.city}</span>
                <span style={{ fontWeight:800, color:'#059669', fontSize:16 }}>{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
