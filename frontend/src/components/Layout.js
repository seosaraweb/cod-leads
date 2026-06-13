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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = NAV.filter(n => n.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <style>{`
        .app-shell { display: flex; min-height: 100vh; background: #f0f0eb; }

        /* ── SIDEBAR (PC/tablette ≥ 768px) ── */
        .sidebar {
          width: 220px; background: #1a1a2e; color: #fff;
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 200;
          transition: transform 0.25s;
        }
        .sidebar-overlay { display: none; }

        /* ── TOPBAR (mobile < 768px) ── */
        .topbar { display: none; }
        .bottom-nav { display: none; }
        .main-content { margin-left: 220px; flex: 1; padding: 28px 32px; min-width: 0; }

        @media (max-width: 768px) {
          .sidebar { transform: translateX(${sidebarOpen ? '0' : '-100%'}); width: 240px; }
          .sidebar-overlay { display: ${sidebarOpen ? 'block' : 'none'}; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
          .topbar { display: flex; align-items: center; justify-content: space-between; background: #1a1a2e; color: #fff; padding: 0 16px; height: 52px; position: sticky; top: 0; z-index: 100; }
          .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a2e; border-top: 1px solid rgba(255,255,255,0.08); z-index: 100; }
          .main-content { margin-left: 0; padding: 16px 16px 90px; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .sidebar { width: 64px; }
          .sidebar .nav-label { display: none; }
          .sidebar .brand-text { display: none; }
          .sidebar .user-info { display: none; }
          .sidebar .logout-btn { padding: 8px; justify-content: center; }
          .main-content { margin-left: 64px; padding: 20px 24px; }
        }

        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 20px; margin: 2px 8px; border-radius: 9px;
          text-decoration: none; cursor: pointer; transition: all 0.15s;
          font-size: 14px; color: #ccc;
        }
        .nav-item.active { background: rgba(37,99,235,0.25); color: #60a5fa; font-weight: 700; }
        .nav-item:hover:not(.active) { background: rgba(255,255,255,0.06); color: #fff; }

        @media (min-width: 769px) and (max-width: 1024px) {
          .nav-item { padding: 12px; margin: 2px 6px; justify-content: center; }
          .nav-item .nav-icon { font-size: 20px; }
        }
      `}</style>

      <div className="app-shell">
        {/* Mobile overlay */}
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ padding: '22px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 24 }}>📦</div>
            <div className="brand-text" style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>COD Leads</div>
            <div className="brand-text" style={{ fontSize: 12, color: '#8888aa', marginTop: 1 }}>Maroc COD Manager</div>
          </div>

          <nav style={{ flex: 1, padding: '10px 0' }}>
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon" style={{ fontSize: 18 }}>{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }} className="user-info">
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>{user?.username}</span>
              <span style={{ marginLeft: 8, background: 'rgba(37,99,235,0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>
                {user?.role === 'admin' ? 'Admin' : 'Support'}
              </span>
            </div>
            <button onClick={handleLogout} className="logout-btn"
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              🚪 Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile topbar */}
        <header className="topbar">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4 }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>COD Leads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#60a5fa' }}>{user?.username}</span>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#aaa', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>↩</button>
          </div>
        </header>

        {/* Main content */}
        <main className="main-content">
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ flex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', gap: 2, borderTop: location.pathname === item.path ? '2px solid #60a5fa' : '2px solid transparent' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: location.pathname === item.path ? '#60a5fa' : '#555', fontWeight: location.pathname === item.path ? 700 : 400 }}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
