import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username:'', password:'', role:'support' });
  const [newPw, setNewPw] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.username || !form.password) return;
    setLoading(true);
    try { await api.post('/users', form); setForm({ username:'', password:'', role:'support' }); setShowAdd(false); load(); }
    catch(err) { alert(err.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/users/${id}`); load();
  };

  const changePw = async (id) => {
    const pw = newPw[id];
    if (!pw || pw.length < 4) return alert('Trop court');
    await api.put(`/users/${id}/password`, { password: pw });
    setNewPw(p => ({...p, [id]:''}));
    alert('✅ Mot de passe changé');
  };

  const inp = { padding:'13px 14px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:16, outline:'none', width:'100%', boxSizing:'border-box', background:'#fff' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>👥 Équipe ({users.length})</h2>
        <button onClick={() => setShowAdd(f=>!f)} style={{ padding:'10px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:14 }}>
          {showAdd ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showAdd && (
        <div style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
          <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="Identifiant" style={inp} />
          <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Mot de passe" style={inp} />
          <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={inp}>
            <option value="support">Support</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={add} disabled={loading} style={{ padding:'14px', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer' }}>
            {loading ? 'Ajout...' : 'Créer l\'agent'}
          </button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {users.map(u => (
          <div key={u.id} style={{ background:'#fff', borderRadius:14, padding:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background: u.role==='admin' ? '#fef3c7' : '#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {u.role==='admin' ? '👑' : '🎧'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:16 }}>{u.username} {u.id===me?.id && <span style={{ fontSize:12, background:'#eff6ff', color:'#2563eb', padding:'2px 8px', borderRadius:99 }}>Vous</span>}</div>
                <div style={{ fontSize:13, color:'#888' }}>{u.role==='admin' ? 'Administrateur' : 'Support'} · Depuis {new Date(u.created_at).toLocaleDateString('fr-MA')}</div>
              </div>
              {u.id !== me?.id && (
                <button onClick={() => del(u.id)} style={{ background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>🗑️</button>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input type="password" placeholder="Nouveau mot de passe" value={newPw[u.id]||''} onChange={e=>setNewPw(p=>({...p,[u.id]:e.target.value}))}
                style={{ flex:1, padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:15, outline:'none' }} />
              <button onClick={() => changePw(u.id)} style={{ padding:'11px 16px', background:'#f0fdf4', color:'#16a34a', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:14 }}>OK</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
