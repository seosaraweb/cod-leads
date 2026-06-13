import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Identifiants incorrects'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f0f0eb' }}>
      {/* Left panel - hidden on mobile */}
      <div style={{ flex:1, background:'#1a1a2e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48 }}
        className="login-left">
        <div style={{ maxWidth:380, color:'#fff', textAlign:'center' }}>
          <div style={{ fontSize:72, marginBottom:16 }}>📦</div>
          <h1 style={{ fontSize:36, fontWeight:900, margin:'0 0 12px', color:'#fff' }}>COD Leads</h1>
          <p style={{ fontSize:18, color:'#8888aa', lineHeight:1.6, margin:0 }}>
            Système de gestion des commandes<br/>Cash On Delivery — Maroc
          </p>
          <div style={{ marginTop:40, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[['✅','Confirmation rapide'],['🖨️','Impression colisage'],['📊','Stats en temps réel'],['👥','Multi-agents']].map(([icon,label]) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'14px', textAlign:'left' }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:13, color:'#aaa' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{ width:'100%', maxWidth:420, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', background:'#fff', borderRadius:20, padding:'40px 36px', boxShadow:'0 4px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:40, marginBottom:8, display:'none' }} className="login-logo">📦</div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#1a1a1a' }}>Connexion</h2>
            <p style={{ margin:'6px 0 0', color:'#888', fontSize:14 }}>Entrez vos identifiants</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Identifiant</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" required autoFocus
                style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:16, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6, color:'#555' }}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'2px solid #e5e7eb', fontSize:16, outline:'none', boxSizing:'border-box' }} />
            </div>
            {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'11px 14px', borderRadius:10, marginBottom:16, fontSize:14, fontWeight:500 }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px', background: loading?'#93c5fd':'#2563eb', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor: loading?'wait':'pointer' }}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .login-left { display: none !important; }
          .login-logo { display: block !important; }
        }
      `}</style>
    </div>
  );
}
