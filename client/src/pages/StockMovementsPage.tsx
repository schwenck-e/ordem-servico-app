import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  History,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StockMovementsTable } from '@/components/stock/StockMovementsTable';
import { StockMovementModal } from '@/components/stock/StockMovementModal';
import { useStockMovements } from '@/hooks/useProducts';
import type { StockMovementType } from '@/types';

export const StockMovementsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<StockMovementType | undefined>(undefined);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const limit = 15;

  const { data, isLoading, isError, error, refetch } = useStockMovements({
    page,
    limit,
    type: selectedType,
  });

  const movements = data?.data || [];
  const meta = data?.meta;

  const handleTypeFilter = (type?: StockMovementType) => {
    setSelectedType(type);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Catálogo de Estoque</span>
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Histórico de Movimentações
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Trilha de auditoria cronológica de entradas, saídas manuais e consumos de O.S.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsMovementModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Movimentação</span>
        </button>
      </div>

      {/* Filter Tabs by Type */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => handleTypeFilter(undefined)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedType === undefined
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => handleTypeFilter('IN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedType === 'IN'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Entradas (IN)
        </button>
        <button
          type="button"
          onClick={() => handleTypeFilter('OUT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedType === 'OUT'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Saídas (OUT)
        </button>
        <button
          type="button"
          onClick={() => handleTypeFilter('ADJUSTMENT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedType === 'ADJUSTMENT'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Ajustes de Balanço
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <TableSkeleton rows={8} columns={8} />
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-800">
            Erro ao carregar histórico de movimentações
          </h3>
          <p className="text-xs text-rose-600 mt-1">
            {error?.data?.message ||
              error?.message ||
              'Falha na comunicação com o servidor.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-xs font-medium text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6 text-slate-400" />}
          title="Nenhuma movimentação registrada"
          description={
            selectedType
              ? 'Não foram encontradas movimentações para o filtro selecionado.'
              : 'Nenhuma entrada, saída ou ajuste de estoque foi efetuado até o momento.'
          }
          action={
            selectedType ? (
              <button
                type="button"
                onClick={() => handleTypeFilter(undefined)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Limpar filtro
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                <ArrowUpDown className="w-4 h-4" />
                Registrar Primeira Movimentação
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <StockMovementsTable movements={movements} />

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              itemName="movimentações"
            />
          )}
        </div>
      )}

      {/* Modal de Movimentação Avulsa */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
      />
    </div>
  );
};
