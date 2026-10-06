import React, { useState } from 'react';
import { Receipt, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { InvoiceFilters, type InvoiceFiltersState } from '@/components/invoices/InvoiceFilters';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { PaymentModal } from '@/components/financial/PaymentModal';
import { SelectBillableModal } from '@/components/invoices/SelectBillableModal';
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useInvoices } from '@/hooks/useInvoices';
import { useDebounce } from '@/hooks/useDebounce';
import type { InvoiceSummary, WorkOrderSummary, QuoteSummary } from '@/types';

const INITIAL_FILTERS: InvoiceFiltersState = {
  search: '',
  status: 'all',
  startDate: '',
  endDate: '',
};

export const InvoicesPage: React.FC = () => {
  // Filtros e busca com debounce
  const [filters, setFilters] = useState<InvoiceFiltersState>(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  // Paginação
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal de Quitação
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceSummary | null>(null);

  // Modais de Criação de Fatura
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectedBillableWO, setSelectedBillableWO] = useState<WorkOrderSummary | null>(null);
  const [selectedBillableQuote, setSelectedBillableQuote] = useState<QuoteSummary | null>(null);

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.status !== 'all' ||
      filters.startDate ||
      filters.endDate
  );

  const handleFiltersChange = (newFilters: InvoiceFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useInvoices({
    page,
    limit,
    search: debouncedSearch,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const invoices = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Faturas e Cobranças</h1>
            <p className="text-xs text-slate-500">
              Controle de faturamento, liquidações e histórico de pagamentos de ordens de serviço.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSelectModalOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Fatura</span>
        </button>
      </div>

      {/* Painel de Filtros */}
      <InvoiceFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Tratamento de Erro */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              Ocorreu um erro ao carregar as faturas: {error?.message || 'Falha de comunicação.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 font-semibold underline hover:no-underline ml-4"
          >
            <RefreshCw className="w-3 h-3" /> Tentar Novamente
          </button>
        </div>
      )}

      {/* Tabela de Faturas */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title={hasActiveFilters ? 'Nenhuma fatura encontrada' : 'Nenhuma fatura cadastrada'}
          description={
            hasActiveFilters
              ? 'Tente ajustar os filtros de busca para encontrar as faturas desejadas.'
              : 'As faturas são geradas automaticamente ao concluir uma Ordem de Serviço ou aprovar um orçamento faturável.'
          }
        />
      ) : (
        <div className="space-y-4">
          <InvoiceTable
            invoices={invoices}
            onOpenPayment={(inv) => setPaymentInvoice(inv)}
          />

          {/* Paginação */}
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              itemName="faturas"
            />
          )}
        </div>
      )}

      {/* Modal de Pagamento */}
      {paymentInvoice && (
        <PaymentModal
          isOpen={Boolean(paymentInvoice)}
          onClose={() => setPaymentInvoice(null)}
          invoiceId={paymentInvoice.id}
          invoiceNumber={paymentInvoice.invoiceNumber}
          remainingBalance={Math.max(0, paymentInvoice.netAmount - paymentInvoice.paidAmount)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Modal de Seleção de Documento para Faturamento */}
      <SelectBillableModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onSelectWorkOrder={(order) => {
          setSelectedBillableWO(order);
          setIsSelectModalOpen(false);
        }}
        onSelectQuote={(quote) => {
          setSelectedBillableQuote(quote);
          setIsSelectModalOpen(false);
        }}
      />

      {/* Modal de Criação de Fatura a partir de OS ou Orçamento */}
      <CreateInvoiceModal
        isOpen={Boolean(selectedBillableWO || selectedBillableQuote)}
        onClose={() => {
          setSelectedBillableWO(null);
          setSelectedBillableQuote(null);
        }}
        workOrder={selectedBillableWO}
        quote={selectedBillableQuote}
        onSuccess={() => {
          setSelectedBillableWO(null);
          setSelectedBillableQuote(null);
          refetch();
        }}
      />
    </div>
  );
};
