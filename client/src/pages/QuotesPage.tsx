import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { QuoteFilters, type QuoteFiltersState } from '@/components/quotes/QuoteFilters';
import { QuoteTable } from '@/components/quotes/QuoteTable';
import { ConvertQuoteModal } from '@/components/quotes/ConvertQuoteModal';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useQuotes } from '@/hooks/useQuotes';
import { useDebounce } from '@/hooks/useDebounce';
import type { QuoteSummary } from '@/types';

const INITIAL_FILTERS: QuoteFiltersState = {
  search: '',
  status: 'all',
  startDate: '',
  endDate: '',
};

export const QuotesPage: React.FC = () => {
  const navigate = useNavigate();

  // Filtros e busca com debounce
  const [filters, setFilters] = useState<QuoteFiltersState>(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  // Paginação
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal de conversão rápida
  const [quoteToConvert, setQuoteToConvert] = useState<QuoteSummary | null>(null);

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.status !== 'all' ||
      filters.startDate ||
      filters.endDate
  );

  const handleFiltersChange = (newFilters: QuoteFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useQuotes({
    page,
    limit,
    search: debouncedSearch,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const quotes = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Orçamentos</h1>
            <p className="text-xs text-slate-500">
              Gestão de propostas comerciais e cotações de serviços e peças.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/quotes/new')}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Painel de Filtros */}
      <QuoteFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Tratamento de Erro */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Ocorreu um erro ao carregar os orçamentos:{' '}
              {error?.message || 'Falha de comunicação com o servidor.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 underline ml-4"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Carregamento / Tabela / EmptyState */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title={hasActiveFilters ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}
          description={
            hasActiveFilters
              ? 'Tente ajustar os filtros ou o termo de busca para encontrar propostas.'
              : 'Comece criando a primeira proposta comercial para seu cliente.'
          }
          action={
            hasActiveFilters ? undefined : (
              <button
                type="button"
                onClick={() => navigate('/quotes/new')}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Orçamento</span>
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <QuoteTable
            quotes={quotes}
            onConvert={(quote) => setQuoteToConvert(quote)}
          />

          {/* Paginação */}
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              itemName="orçamentos"
            />
          )}
        </div>
      )}

      {/* Modal de Conversão Rápida em OS */}
      <ConvertQuoteModal
        isOpen={Boolean(quoteToConvert)}
        onClose={() => setQuoteToConvert(null)}
        quote={quoteToConvert}
      />
    </div>
  );
};
