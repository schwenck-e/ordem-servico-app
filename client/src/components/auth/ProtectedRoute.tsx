import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Carregando sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'ADMIN' && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Acesso Restrito
        </h2>
        <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
          Seu perfil de usuário (<span className="font-semibold text-slate-700">Operador</span>) não tem permissão para acessar esta área administrativa. Contate um administrador do sistema caso necessite de autorização.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Dashboard
        </Link>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
