import React from 'react';
import { ClipboardList, Users, Wrench, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHealth } from '@/hooks/useHealth';

export const DashboardPage: React.FC = () => {
  const { data: health, isLoading, isError } = useHealth();

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Operacional</h2>
        <p className="text-sm text-slate-500 mt-1">
          Bem-vindo ao Sistema de Gestão de Ordens de Serviço.
        </p>
      </div>

      {/* Cartão de Status do Backend / Infra */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Status dos Serviços Integrados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Fastify Backend</span>
            <span className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              {isLoading ? (
                'Verificando...'
              ) : isError ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Indisponível
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Porta 3333 Conectada
                </span>
              )}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Banco de Dados SQLite</span>
            <span className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              {health?.database?.status === 'connected' ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Prisma Conectado
                </span>
              ) : (
                <span className="text-slate-500">Aguardando backend</span>
              )}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Frontend Runtime</span>
            <span className="text-sm font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Vite + React 18 + Tailwind
            </span>
          </div>
        </div>
      </div>

      {/* Acesso Rápido aos Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/work-orders"
          className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
            Ordens de Serviço
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Abertura, acompanhamento de status em tabela e Kanban, cálculo de peças e serviços.
          </p>
        </Link>

        <Link
          to="/customers"
          className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
            Clientes
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Cadastro de pessoas físicas e jurídicas, telefones de contato e histórico de atendimentos.
          </p>
        </Link>

        <Link
          to="/technicians"
          className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
            Técnicos
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Gestão da equipe de execução, especialidades técnicas e atribuição de responsabilidades.
          </p>
        </Link>
      </div>
    </div>
  );
};
