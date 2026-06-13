import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const NAV = [
  { path: '/', icon: '➕', label: 'Nouvelle commande', roles: ['support', 'admin'] },
  { path: '/orders', icon: '📋', label: 'Commandes', roles: ['support', 'admin'] },
  { path: '/print', icon: '🖨️', label: 'Impression', roles: ['support', 'admin'] },
  { path: '/stats', icon: '📊', label: 'Statistiques', roles: ['admin'] },
  { path: '/products', icon: '📦', label: 'Produits', roles: ['admin'] },
  { path: '/users', icon: '👥', label: 'Équipe', roles: ['admin'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const navItems = NAV.filter(n => n.roles.includes(user?.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f0' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: mobile ? 0 : 0, height: '100vh', zIndex: 100,
        transition: 'transform 0.2s', transform: mobile ? 'translateX(0)' : undefined
      }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 22 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>COD Leads</div>
          <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>Maroc COD Manager</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', margin: '2px 8px', borderRadius: 8,
                background: location.pathname === item.path ? 'rgba(37,99,235,0.3)' : 'transparent',
                color: location.pathname === item.path ? '#60a5fa' : '#ccc',
                fontWeight: location.pathname === item.path ? 600 : 400,
                fontSize: 14, cursor: 'pointer', transition: 'all 0.15s'
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>
            <span style={{ color: '#60a5fa', fontWeight: 600 }}>{user?.username}</span>
            <span style={{ marginLeft: 8, background: 'rgba(37,99,235,0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>
              {user?.role === 'admin' ? 'Admin' : 'Support'}
            </span>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#888',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginTop: 8
          }}>Déconnexion</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '24px 28px', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
