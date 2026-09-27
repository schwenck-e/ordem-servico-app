import React from 'react';
import { Table, Kanban, RotateCcw, Calendar, User, SlidersHorizontal } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { useTechnicians } from '@/hooks/useTechnicians';
import type { WorkOrderStatus, WorkOrderPriority } from '@/types';

export type ViewMode = 'table' | 'kanban';

export interface WorkOrderFiltersState {
  search: string;
  status: WorkOrderStatus | 'all';
  priority: WorkOrderPriority | 'all';
  technicianId: string;
  startDate: string;
  endDate: string;
}

interface WorkOrderFiltersProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: WorkOrderFiltersState;
  onFiltersChange: (newFilters: WorkOrderFiltersState) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const WorkOrderFilters: React.FC<WorkOrderFiltersProps> = ({
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const { data: techniciansData, isLoading: isLoadingTechs } = useTechnicians({
    isActive: true,
    limit: 100,
  });

  const technicians = techniciansData?.data || [];

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value as WorkOrderStatus | 'all' });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, priority: e.target.value as WorkOrderPriority | 'all' });
  };

  const handleTechnicianChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, technicianId: e.target.value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onFiltersChange({ ...filters, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onFiltersChange({ ...filters, endDate: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      {/* Top Bar: Search and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar por OS, cliente, equipamento ou defeito..."
            className="w-full max-w-none"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Limpar todos os filtros"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selects & Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Status */}
        <div>
          <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            Status
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">Todos os status</option>
            <option value="OPEN">Aberta</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="WAITING_PARTS">Aguardando Peças</option>
            <option value="WAITING_APPROVAL">Aguardando Aprovação</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELED">Cancelada</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            Prioridade
          </label>
          <select
            value={filters.priority}
            onChange={handlePriorityChange}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">Todas as prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>

        {/* Technician */}
        <div>
          <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            Técnico
          </label>
          <select
            value={filters.technicianId}
            onChange={handleTechnicianChange}
            disabled={isLoadingTechs}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60"
          >
            <option value="">Todos os técnicos</option>
            <option value="unassigned">Não atribuído</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} {tech.specialty ? `(${tech.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Data Inicial
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={handleStartDateChange}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Data Final
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={handleEndDateChange}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
