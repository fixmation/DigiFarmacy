import React from 'react';
import { useAuth } from './useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const defaultAllowedRoles = new Set(['pharmacy', 'laboratory', 'admin', 'developer_admin']);

interface RoleMiddlewareProps {
  children: React.ReactNode;
  roles?: string[];
}

const RoleMiddleware: React.FC<RoleMiddlewareProps> = ({ children, roles }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const allowedRoles = new Set(roles || Array.from(defaultAllowedRoles));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile || !allowedRoles.has(profile.role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RoleMiddleware;
