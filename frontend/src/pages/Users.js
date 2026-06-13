import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'support' });
  const [loading, setLoading] = useState(false);
  const [newPw, setNewPw] = useState({});

  const load = () => api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.username || !form.password) return;
    setLoading(true);
    try {
      await api.post('/users', form);
      setForm({ username: '', password: '', role: 'support' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
    setLoading(false);
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const changePw = async (id) => {
    const pw = newPw[id];
    if (!pw || pw.length < 4) return alert('Mot de passe trop court');
    await api.put(`/users/${id}/password`, { password: pw });
    setNewPw(p => ({ ...p, [id]: '' }));
    alert('Mot de passe mis à jour');
  };

  const inp = { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, background: '#fff' };

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>👥 Équipe Support</h1>

      {/* Add user */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>➕ Ajouter un agent</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#555' }}>Identifiant</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="support1" style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#555' }}>Mot de passe</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••" style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#555' }}>Rôle</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inp}>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={add} disabled={loading}
            style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Ajouter
          </button>
        </div>
      </div>

      {/* Users list */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '1.5px solid #f0f0f0' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Identifiant</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Rôle</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Créé le</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Changer mot de passe</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 20px', fontWeight: 600 }}>
                  {u.username}
                  {u.id === me?.id && <span style={{ marginLeft: 8, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>Vous</span>}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <span style={{ background: u.role === 'admin' ? '#fef3c7' : '#f0fdf4', color: u.role === 'admin' ? '#92400e' : '#166534', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {u.role === 'admin' ? '👑 Admin' : '🎧 Support'}
                  </span>
                </td>
                <td style={{ padding: '12px 20px', color: '#888', fontSize: 13 }}>
                  {new Date(u.created_at).toLocaleDateString('fr-MA')}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="password" placeholder="Nouveau mdp" value={newPw[u.id] || ''}
                      onChange={e => setNewPw(p => ({ ...p, [u.id]: e.target.value }))}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #e0e0e0', fontSize: 13, width: 140 }} />
                    <button onClick={() => changePw(u.id)}
                      style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                      Changer
                    </button>
                  </div>
                </td>
                <td style={{ padding: '12px 20px' }}>
                  {u.id !== me?.id && (
                    <button onClick={() => del(u.id)}
                      style={{ padding: '6px 14px', background: '#fff5f5', color: '#c0392b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                      🗑️ Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
