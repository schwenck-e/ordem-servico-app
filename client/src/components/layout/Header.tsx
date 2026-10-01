import React from 'react';
import { useLocation } from 'react-router-dom';
import { Server, LogOut, Shield } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { useAuth } from '@/hooks/useAuth';

const routeTitles: Record<string, string> = {
  '/': 'Visão Geral',
  '/work-orders': 'Ordens de Serviço',
  '/customers': 'Clientes',
  '/technicians': 'Técnicos',
  '/users': 'Usuários e Colaboradores',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { data: health, isLoading, isError } = useHealth();
  const { user, logout } = useAuth();

  const currentTitle = routeTitles[location.pathname] || 'Sistema';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 print:hidden">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Sistema</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800">{currentTitle}</span>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Backend API Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">API:</span>
          {isLoading ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
              Conectando...
            </span>
          ) : isError ? (
            <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Desconectada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Online {health?.database?.status === 'connected' && '(DB OK)'}
            </span>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isAdmin
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Usuário'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600">
                    <Shield className="w-2.5 h-2.5" />
                    Administrador
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500">
                    Operador
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
            title="Sair do sistema (Logout)"
            aria-label="Sair da sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
