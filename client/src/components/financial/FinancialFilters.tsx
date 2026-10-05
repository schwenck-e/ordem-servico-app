import React from 'react';
import { RotateCcw, Calendar, SlidersHorizontal, Tag, Filter } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import type {
  FinancialTransactionType,
  FinancialTransactionStatus,
  FinancialTransactionCategory,
} from '@/types';

export interface FinancialFiltersState {
  search: string;
  type: FinancialTransactionType | 'all';
  status: FinancialTransactionStatus | 'all';
  category: FinancialTransactionCategory | 'all';
  startDate: string;
  endDate: string;
}

interface FinancialFiltersProps {
  filters: FinancialFiltersState;
  onFiltersChange: (newFilters: FinancialFiltersState) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FinancialFilters: React.FC<FinancialFiltersProps> = ({
  filters,
  onFiltersChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, type: e.target.value as FinancialTransactionType | 'all' });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value as FinancialTransactionStatus | 'all' });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, category: e.target.value as FinancialTransactionCategory | 'all' });
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
            placeholder="Buscar por descrição..."
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
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Tipo
          </label>
          <select
            value={filters.type}
            onChange={handleTypeChange}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">Todas as Operações</option>
            <option value="REVENUE">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Status
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">Todos os Status</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago / Realizado</option>
            <option value="CANCELED">Cancelado</option>
          </select>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Categoria
          </label>
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="SERVICE_REVENUE">Receita de Serviços</option>
            <option value="PARTS_PURCHASE">Compra de Peças</option>
            <option value="FIXED_EXPENSE">Despesa Fixa</option>
            <option value="VARIABLE_EXPENSE">Despesa Variável</option>
            <option value="OTHER">Outros</option>
          </select>
        </div>

        {/* Data Inicial */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Vencimento a partir de
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
            Vencimento até
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
