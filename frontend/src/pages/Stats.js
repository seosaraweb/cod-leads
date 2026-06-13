import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.get(`/orders/stats?date=${date}`).then(r => setStats(r.data)).catch(() => {});
  }, [date]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📊 Statistiques</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding:'9px 12px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14 }} />
      </div>

      {!stats ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Chargement...</div> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { label:'Aujourd\'hui', val: stats.todayCount, color:'#2563eb', bg:'#eff6ff' },
              { label:'Total', val: stats.totalCount, color:'#059669', bg:'#f0fdf4' },
              { label:'Supports actifs', val: stats.todayBySupport.length, color:'#7c3aed', bg:'#f5f3ff' },
              { label:'Villes touchées', val: stats.todayByCity.length, color:'#ea580c', bg:'#fff7ed' },
            ].map(c => (
              <div key={c.label} style={{ background:c.bg, borderRadius:14, padding:'16px' }}>
                <div style={{ fontSize:12, color: c.color, fontWeight:600, marginBottom:4 }}>{c.label}</div>
                <div style={{ fontSize:32, fontWeight:900, color:c.color }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* By support */}
          <div style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>👥 Confirmations par support</div>
            {stats.todayBySupport.length === 0 ? <div style={{ color:'#bbb', fontSize:14 }}>Aucune commande ce jour</div> :
              stats.todayBySupport.map((s, i) => (
                <div key={s.support_name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#2563eb', flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{s.support_name}</div>
                    <div style={{ background:'#e0e7ff', height:6, borderRadius:99, marginTop:4, overflow:'hidden' }}>
                      <div style={{ background:'#2563eb', height:'100%', width:`${(s.count/stats.todayBySupport[0].count)*100}%`, borderRadius:99 }} />
                    </div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:20, color:'#2563eb', flexShrink:0 }}>{s.count}</div>
                </div>
              ))
            }
          </div>

          {/* By city */}
          <div style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>🗺️ Top villes</div>
            {stats.todayByCity.map((c, i) => (
              <div key={c.city} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ fontSize:13, color:'#aaa', width:20, fontWeight:700 }}>{i+1}</div>
                <div style={{ flex:1, fontSize:15, fontWeight:500 }}>{c.city}</div>
                <div style={{ fontWeight:700, color:'#059669', fontSize:16 }}>{c.count}</div>
              </div>
            ))}
          </div>

          {/* By status */}
          <div style={{ background:'#fff', borderRadius:14, padding:'14px' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>📦 Total par statut</div>
            {[
              { s:'confirmée', color:'#065f46', bg:'#d1fae5' },
              { s:'expédiée',  color:'#1e40af', bg:'#dbeafe' },
              { s:'livrée',    color:'#166534', bg:'#dcfce7' },
              { s:'annulée',   color:'#991b1b', bg:'#fee2e2' },
              { s:'retournée', color:'#92400e', bg:'#fef3c7' },
            ].map(({ s, color, bg }) => {
              const found = stats.totalByStatus.find(x => x.status === s);
              return (
                <div key={s} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:bg, borderRadius:10, marginBottom:8 }}>
                  <span style={{ fontSize:15, fontWeight:600, color }}>{s}</span>
                  <span style={{ fontSize:20, fontWeight:800, color }}>{found?.count||0}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
