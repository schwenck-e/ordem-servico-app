import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { WorkOrderFilters, type ViewMode, type WorkOrderFiltersState } from '@/components/work-orders/WorkOrderFilters';
import { WorkOrderTable } from '@/components/work-orders/WorkOrderTable';
import { WorkOrderKanban } from '@/components/work-orders/WorkOrderKanban';
import { WorkOrderStatusModal } from '@/components/work-orders/WorkOrderStatusModal';
import { WorkOrderQuickViewModal } from '@/components/work-orders/WorkOrderQuickViewModal';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useDebounce } from '@/hooks/useDebounce';
import type { WorkOrderSummary } from '@/types';

const STORAGE_VIEW_KEY = 'ordem-servico:work-orders:view-mode';

const INITIAL_FILTERS: WorkOrderFiltersState = {
  search: '',
  status: 'all',
  priority: 'all',
  technicianId: '',
  startDate: '',
  endDate: '',
};

export const WorkOrdersPage: React.FC = () => {
  // Persisted view mode (Table or Kanban)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_VIEW_KEY);
    return saved === 'kanban' || saved === 'table' ? saved : 'table';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_VIEW_KEY, mode);
  };

  // Filters and Debounced Search
  const [filters, setFilters] = useState<WorkOrderFiltersState>(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  // Pagination for table view
  const [page, setPage] = useState(1);
  const limit = 10;

  // Active filters check
  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.technicianId ||
      filters.startDate ||
      filters.endDate
  );

  const handleFiltersChange = (newFilters: WorkOrderFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  // Modals state
  const [statusModalOrder, setStatusModalOrder] = useState<WorkOrderSummary | null>(null);
  const [quickViewOrderId, setQuickViewOrderId] = useState<string | null>(null);
  const [isNewOrderNoticeOpen, setIsNewOrderNoticeOpen] = useState(false);

  // Query: load 100 items if in Kanban mode to populate columns comfortably, or 10 per page in Table mode
  const { data, isLoading, isError, error, refetch } = useWorkOrders({
    page: viewMode === 'kanban' ? 1 : page,
    limit: viewMode === 'kanban' ? 100 : limit,
    search: debouncedSearch,
    status: filters.status,
    priority: filters.priority,
    technicianId: filters.technicianId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const workOrders = data?.data || [];
  const meta = data?.meta;

  const handleOpenStatusModal = (order: WorkOrderSummary) => {
    setStatusModalOrder(order);
  };

  const handleCloseStatusModal = () => {
    setStatusModalOrder(null);
  };

  const handleOpenQuickView = (order: WorkOrderSummary) => {
    setQuickViewOrderId(order.id);
  };

  const handleCloseQuickView = () => {
    setQuickViewOrderId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ordens de Serviço</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie o ciclo de vida operacional, transições de status e técnicos de atendimento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewOrderNoticeOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </button>
      </div>

      {/* Filter and View Mode Controls */}
      <WorkOrderFilters
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content Area */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <TableSkeleton rows={8} columns={9} />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-72 sm:w-80 shrink-0 bg-slate-100/70 rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse"
              >
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-28 bg-slate-200 rounded" />
                <div className="h-28 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )
      ) : isError ? (
        <div className="p-8 bg-white border border-rose-200 rounded-xl text-center space-y-3 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">
            Erro ao carregar Ordens de Serviço
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {error?.data?.message ||
              error?.message ||
              'Ocorreu uma falha ao comunicar com o servidor.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      ) : workOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6" />}
          title="Nenhuma Ordem de Serviço encontrada"
          description={
            hasActiveFilters
              ? 'Não foram encontradas ordens correspondentes aos filtros aplicados.'
              : 'Nenhuma ordem de serviço cadastrada no sistema até o momento.'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-sm font-medium transition-colors"
              >
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : viewMode === 'table' ? (
        <div className="space-y-0">
          <WorkOrderTable
            workOrders={workOrders}
            onStatusChange={handleOpenStatusModal}
            onView={handleOpenQuickView}
          />
          {meta && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              itemName="ordens de serviço"
            />
          )}
        </div>
      ) : (
        <WorkOrderKanban
          workOrders={workOrders}
          onStatusChange={handleOpenStatusModal}
          onView={handleOpenQuickView}
        />
      )}

      {/* Status Transition Modal */}
      <WorkOrderStatusModal
        order={statusModalOrder}
        isOpen={Boolean(statusModalOrder)}
        onClose={handleCloseStatusModal}
      />

      {/* Quick View Modal */}
      <WorkOrderQuickViewModal
        orderId={quickViewOrderId}
        isOpen={Boolean(quickViewOrderId)}
        onClose={handleCloseQuickView}
        onOpenStatusModal={(order) => {
          setStatusModalOrder(order);
        }}
      />

      {/* New Order Notice Modal */}
      <Modal
        isOpen={isNewOrderNoticeOpen}
        onClose={() => setIsNewOrderNoticeOpen(false)}
        title="Nova Ordem de Serviço"
        maxWidth="sm"
        footer={
          <button
            type="button"
            onClick={() => setIsNewOrderNoticeOpen(false)}
            className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Entendido
          </button>
        }
      >
        <div className="flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-800">
              Formulário Completo de Abertura de O.S.
            </p>
            <p>
              O formulário detalhado de abertura de O.S. com seleção dinâmica de peças, serviços,
              cálculo de descontos e totais em tempo real faz parte do ticket <strong>ELI-17</strong>.
            </p>
            <p className="text-slate-500">
              No painel atual (ENG-16), você já pode filtrar, inspecionar em tabela ou Kanban e
              realizar transições de status com auditoria completa!
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
