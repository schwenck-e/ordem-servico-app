import React from 'react';
import { Server } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';

export const Header: React.FC = () => {
  const { data: health, isLoading, isError } = useHealth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      {/* Title / Breadcrumb Placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Sistema</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800">Visão Geral</span>
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

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
            OP
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Operador</p>
            <p className="text-[10px] text-slate-400">Atendimento</p>
          </div>
        </div>
      </div>
    </header>
  );
};
