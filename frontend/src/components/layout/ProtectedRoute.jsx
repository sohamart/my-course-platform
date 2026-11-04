import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
        <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 shadow-glass border border-white/80">
          <div className="w-10 h-10 rounded-2xl bg-brand-black flex items-center justify-center animate-bounce">
            <span className="w-3 h-3 rounded-full bg-brand-lavender animate-ping" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Loading your learning space...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // If student attempts to access admin, send to /dashboard
    if (user?.role === 'student' && allowedRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

