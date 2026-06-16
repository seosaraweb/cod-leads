import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LandingPages from './pages/LandingPages';
import Login from './pages/Login';
import NewOrder from './pages/NewOrder';
import Orders from './pages/Orders';
import PrintPage from './pages/PrintPage';
import Stats from './pages/Stats';
import Products from './pages/Products';
import Users from './pages/Users';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/backoffice/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/backoffice" replace />;
  return <Layout>{children}</Layout>;
}

function NotFound() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f0' }}>
      <div style={{ textAlign:'center', color:'#ccc' }}>
        <div style={{ fontSize:80, fontWeight:900, color:'#e5e7eb' }}>404</div>
        <div style={{ fontSize:16, color:'#aaa', marginTop:8 }}>Page introuvable</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing pages publiques */}
          <Route path="/p/:id" element={<LandingPage />} />

          {/* Dashboard sous URL secrète /backoffice */}
          <Route path="/backoffice/login" element={<Login />} />
          <Route path="/backoffice" element={<ProtectedRoute><NewOrder /></ProtectedRoute>} />
          <Route path="/backoffice/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/backoffice/print" element={<ProtectedRoute><PrintPage /></ProtectedRoute>} />
          <Route path="/backoffice/stats" element={<ProtectedRoute adminOnly><Stats /></ProtectedRoute>} />
          <Route path="/backoffice/products" element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>} />
          <Route path="/backoffice/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="/backoffice/landing-pages" element={<ProtectedRoute adminOnly><LandingPages /></ProtectedRoute>} />

          {/* Tout le reste = 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
