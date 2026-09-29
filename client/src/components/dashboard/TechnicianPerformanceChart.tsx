import React from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { TechnicianMetricItem } from '@/types';

interface TechnicianPerformanceChartProps {
  data: TechnicianMetricItem[];
  loading?: boolean;
}

export const TechnicianPerformanceChart: React.FC<TechnicianPerformanceChartProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxOrders = Math.max(...data.map((t) => t.totalOrders), 1);

  // Separate unassigned from assigned technicians
  const unassigned = data.find((t) => t.technicianId === null);
  const assigned = data
    .filter((t) => t.technicianId !== null)
    .sort((a, b) => b.totalOrders - a.totalOrders);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-brand-600" />
        Produtividade por Técnico
      </h3>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Nenhum dado de técnicos neste período</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unassigned warning */}
          {unassigned && unassigned.totalOrders > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Não atribuído — {unassigned.totalOrders} ordem(ns)
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-amber-700">
                <span>{unassigned.completedOrders} concluída(s)</span>
                <span>{unassigned.inProgressOrders} em andamento</span>
                <span>{unassigned.pendingOrders} pendente(s)</span>
                <span className="ml-auto font-medium">{formatCurrency(unassigned.totalRevenue)}</span>
              </div>
            </div>
          )}

          {/* Assigned technicians */}
          {assigned.map((tech) => {
            const completedWidth =
              tech.totalOrders > 0 ? (tech.completedOrders / maxOrders) * 100 : 0;
            const inProgressWidth =
              tech.totalOrders > 0 ? (tech.inProgressOrders / maxOrders) * 100 : 0;
            const pendingWidth =
              tech.totalOrders > 0 ? (tech.pendingOrders / maxOrders) * 100 : 0;

            return (
              <div key={tech.technicianId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {tech.name}
                    </span>
                    {tech.specialty && (
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        · {tech.specialty}
                      </span>
                    )}
                    {tech.isActive === false && (
                      <span className="text-xs text-rose-500 font-medium">(Inativo)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500">
                      {tech.totalOrders} OS
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      {formatCurrency(tech.totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* Segmented bar */}
                <div className="flex h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  {completedWidth > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${completedWidth}%` }}
                      title={`${tech.completedOrders} concluída(s)`}
                    />
                  )}
                  {inProgressWidth > 0 && (
                    <div
                      className="bg-amber-400 transition-all duration-500"
                      style={{ width: `${inProgressWidth}%` }}
                      title={`${tech.inProgressOrders} em andamento`}
                    />
                  )}
                  {pendingWidth > 0 && (
                    <div
                      className="bg-slate-300 transition-all duration-500"
                      style={{ width: `${pendingWidth}%` }}
                      title={`${tech.pendingOrders} pendente(s)`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          {assigned.length > 0 && (
            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">Concluídas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500">Em andamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500">Pendentes</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
