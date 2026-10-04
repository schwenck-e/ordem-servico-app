import React from 'react';
import { RotateCcw, Calendar, SlidersHorizontal } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import type { QuoteStatus } from '@/types';

export interface QuoteFiltersState {
  search: string;
  status: QuoteStatus | 'all';
  startDate: string;
  endDate: string;
}

interface QuoteFiltersProps {
  filters: QuoteFiltersState;
  onFiltersChange: (newFilters: QuoteFiltersState) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const QuoteFilters: React.FC<QuoteFiltersProps> = ({
  filters,
  onFiltersChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value as QuoteStatus | 'all' });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, endDate: e.target.value });
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Busca textual */}
        <div className="w-full md:w-96">
          <SearchInput
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar por número, cliente, equipamento..."
          />
        </div>

        {/* Botão de limpar filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Barra de filtros avançados */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Status da Proposta
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">Todos os Status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SENT">Enviado ao Cliente</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Recusado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
        </div>

        {/* Data Inicial */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Criado a partir de
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={handleStartDateChange}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Data Final */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Criado até
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={handleEndDateChange}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
