import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useHealth } from '@/hooks/useHealth';
import { useMetricsSummary, useMetricsByStatus, useMetricsByTechnician, METRICS_QUERY_KEY } from '@/hooks/useMetrics';
import { DashboardPeriodFilter } from '@/components/dashboard/DashboardPeriodFilter';
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid';
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart';
import { TechnicianPerformanceChart } from '@/components/dashboard/TechnicianPerformanceChart';
import { RecentWorkOrdersTable } from '@/components/dashboard/RecentWorkOrdersTable';
import type { PeriodPresetKey, MetricsPeriodFilter } from '@/types';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealth();

  // Period filter state
  const [activePreset, setActivePreset] = useState<PeriodPresetKey>('all');
  const [filters, setFilters] = useState<MetricsPeriodFilter>({});

  // Metrics queries
  const { data: summary, isLoading: summaryLoading } = useMetricsSummary(filters);
  const { data: byStatus, isLoading: statusLoading } = useMetricsByStatus(filters);
  const { data: byTechnician, isLoading: technicianLoading } = useMetricsByTechnician(filters);

  const handlePresetChange = useCallback(
    (preset: PeriodPresetKey, newFilters: MetricsPeriodFilter) => {
      setActivePreset(preset);
      setFilters(newFilters);
    },
    []
  );

  const handleCustomDateChange = useCallback((newFilters: MetricsPeriodFilter) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...METRICS_QUERY_KEY] });
  }, [queryClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Operacional
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visão geral de métricas, desempenho e ordens de serviço em tempo real.
          </p>
        </div>
        <Link
          to="/work-orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </Link>
      </div>

      {/* Period Filter */}
      <DashboardPeriodFilter
        activePreset={activePreset}
        filters={filters}
        onPresetChange={handlePresetChange}
        onCustomDateChange={handleCustomDateChange}
        onRefresh={handleRefresh}
      />

      {/* KPI Cards */}
      <DashboardKpiGrid summary={summary} loading={summaryLoading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistributionChart
          data={byStatus?.data ?? []}
          totalOrders={byStatus?.totalOrders ?? 0}
          loading={statusLoading}
        />
        <TechnicianPerformanceChart
          data={byTechnician?.data ?? []}
          loading={technicianLoading}
        />
      </div>

      {/* Recent Work Orders */}
      <RecentWorkOrdersTable />

      {/* Infrastructure Status Footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-slate-500 uppercase tracking-wider">
            Status do Sistema
          </span>
          <div className="flex items-center gap-1.5">
            {healthLoading ? (
              <span className="text-slate-400">Verificando...</span>
            ) : healthError ? (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> API Indisponível
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> API Conectada
              </span>
            )}
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            {health?.database?.status === 'connected' ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SQLite Conectado
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Aguardando banco
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
