import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

const allowedRoles = new Set(['pharmacy', 'laboratory', 'admin', 'developer_admin']);

const RoleMiddleware: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!profile || !allowedRoles.has(profile.role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RoleMiddleware;
