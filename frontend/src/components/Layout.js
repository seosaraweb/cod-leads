import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const NAV = [
  { path: '/', icon: '✅', label: 'Confirmer', roles: ['support','admin'] },
  { path: '/orders', icon: '📋', label: 'Commandes', roles: ['support','admin'] },
  { path: '/print', icon: '🖨️', label: 'Imprimer', roles: ['support','admin'] },
  { path: '/stats', icon: '📊', label: 'Stats', roles: ['admin'] },
  { path: '/products', icon: '📦', label: 'Produits', roles: ['admin'] },
  { path: '/users', icon: '👥', label: 'Équipe', roles: ['admin'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navItems = NAV.filter(n => n.roles.includes(user?.role));
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f0eb' }}>

      {/* ══ SIDEBAR — PC only (≥900px) ══ */}
      <aside style={{
        width: 220, background:'#1a1a2e', color:'#fff',
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, height:'100vh', zIndex:50,
        // hidden on mobile via media query below
      }} className="pc-sidebar">
        <div style={{ padding:'22px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:24 }}>📦</div>
          <div style={{ fontSize:16, fontWeight:700, marginTop:4 }}>COD Leads</div>
          <div style={{ fontSize:12, color:'#8888aa', marginTop:1 }}>Maroc COD Manager</div>
        </div>
        <nav style={{ flex:1, padding:'10px 0' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', margin:'2px 8px', borderRadius:9, textDecoration:'none', fontSize:14, color: location.pathname===item.path ? '#60a5fa' : '#ccc', fontWeight: location.pathname===item.path ? 700 : 400, background: location.pathname===item.path ? 'rgba(37,99,235,0.25)' : 'transparent' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:13, color:'#aaa', marginBottom:8 }}>
            <span style={{ color:'#60a5fa', fontWeight:700 }}>{user?.username}</span>
            <span style={{ marginLeft:8, background:'rgba(37,99,235,0.2)', color:'#60a5fa', padding:'2px 8px', borderRadius:99, fontSize:11 }}>{user?.role==='admin'?'Admin':'Support'}</span>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', color:'#888', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', fontSize:13 }}>🚪 Déconnexion</button>
        </div>
      </aside>

      {/* ══ MOBILE DRAWER ══ */}
      {drawerOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          {/* Overlay */}
          <div onClick={()=>setDrawerOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
          {/* Drawer */}
          <aside style={{ position:'absolute', top:0, left:0, width:260, height:'100%', background:'#1a1a2e', display:'flex', flexDirection:'column', zIndex:201 }}>
            <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:22 }}>📦</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginTop:2 }}>COD Leads</div>
              </div>
              <button onClick={()=>setDrawerOpen(false)} style={{ background:'none', border:'none', color:'#888', fontSize:24, cursor:'pointer', padding:4 }}>✕</button>
            </div>
            <nav style={{ flex:1, padding:'10px 0' }}>
              {navItems.map(item => (
                <Link key={item.path} to={item.path} onClick={()=>setDrawerOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', textDecoration:'none', fontSize:16, color: location.pathname===item.path ? '#60a5fa' : '#ccc', fontWeight: location.pathname===item.path ? 700 : 400, background: location.pathname===item.path ? 'rgba(37,99,235,0.2)' : 'transparent', borderLeft: location.pathname===item.path ? '3px solid #60a5fa' : '3px solid transparent' }}>
                  <span style={{ fontSize:22 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:14, color:'#60a5fa', fontWeight:700, marginBottom:10 }}>{user?.username} · {user?.role==='admin'?'Admin':'Support'}</div>
              <button onClick={handleLogout} style={{ width:'100%', padding:'10px', background:'rgba(255,255,255,0.05)', color:'#888', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', fontSize:14 }}>🚪 Déconnexion</button>
            </div>
          </aside>
        </div>
      )}

      {/* ══ TOPBAR — mobile only ══ */}
      <header className="mobile-topbar" style={{ display:'none', position:'fixed', top:0, left:0, right:0, height:52, background:'#1a1a2e', color:'#fff', alignItems:'center', justifyContent:'space-between', padding:'0 16px', zIndex:100 }}>
        <button onClick={()=>setDrawerOpen(true)} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer', padding:4, lineHeight:1 }}>☰</button>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>📦</span>
          <span style={{ fontWeight:700, fontSize:16 }}>COD Leads</span>
        </div>
        <span style={{ fontSize:13, color:'#60a5fa', fontWeight:600 }}>{user?.username}</span>
      </header>

      {/* ══ MAIN CONTENT ══ */}
      <main className="main-content" style={{ flex:1, marginLeft:220, padding:'28px 32px', minWidth:0 }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          {children}
        </div>
      </main>

      {/* ══ BOTTOM NAV — mobile only ══ */}
      <nav className="mobile-bottom-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, background:'#1a1a2e', borderTop:'1px solid rgba(255,255,255,0.08)', zIndex:100 }}>
        {navItems.map(item => (
          <Link key={item.path} to={item.path} style={{ flex:1, textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 4px 6px', borderTop: location.pathname===item.path ? '2px solid #60a5fa' : '2px solid transparent' }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ fontSize:10, color: location.pathname===item.path ? '#60a5fa' : '#555', fontWeight: location.pathname===item.path ? 700 : 400, marginTop:2 }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        @media (max-width: 899px) {
          .pc-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content { margin-left: 0 !important; padding: 68px 16px 80px !important; }
        }
        @media (min-width: 900px) {
          .mobile-topbar { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
