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
  const navItems = NAV.filter(n => n.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f4f0' }}>
      {/* Top bar mobile */}
      <header style={{ background: '#1a1a2e', color: '#fff', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📦</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>COD Leads</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#60a5fa' }}>{user?.username}</span>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#aaa', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            Sortir
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '16px', paddingBottom: 80, maxWidth: 700, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a2e', display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 100 }}>
        {navItems.map(item => (
          <Link key={item.path} to={item.path} style={{ flex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', gap: 2, borderTop: location.pathname === item.path ? '2px solid #60a5fa' : '2px solid transparent' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 10, color: location.pathname === item.path ? '#60a5fa' : '#666', fontWeight: location.pathname === item.path ? 700 : 400 }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
