import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { FinancialKpiGrid } from '@/components/financial/FinancialKpiGrid';
import { CashflowChart } from '@/components/financial/CashflowChart';
import { FinancialFilters, type FinancialFiltersState } from '@/components/financial/FinancialFilters';
import { FinancialTable } from '@/components/financial/FinancialTable';
import { TransactionModal } from '@/components/financial/TransactionModal';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  useFinancialCashflow,
  useFinancialTransactions,
  usePayFinancialTransaction,
} from '@/hooks/useFinancial';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import type { FinancialTransaction } from '@/types';

const INITIAL_FILTERS: FinancialFiltersState = {
  search: '',
  type: 'all',
  status: 'all',
  category: 'all',
  startDate: '',
  endDate: '',
};

type QuickTab = 'ALL' | 'TO_RECEIVE' | 'TO_PAY' | 'PAID';

export const FinancialPage: React.FC = () => {
  const toast = useToast();

  // Filtros da tabela
  const [filters, setFilters] = useState<FinancialFiltersState>(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  // Aba rápida
  const [activeTab, setActiveTab] = useState<QuickTab>('ALL');

  // Paginação
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modais e ações
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [payingTxId, setPayingTxId] = useState<string | null>(null);

  const payMutation = usePayFinancialTransaction();

  // Consulta de Fluxo de Caixa (KPIs e Gráfico)
  const {
    data: cashflowData,
    isLoading: isCashflowLoading,
    isError: isCashflowError,
    error: cashflowError,
    refetch: refetchCashflow,
  } = useFinancialCashflow();

  // Ajuste dos parâmetros com base na aba rápida
  const effectiveType =
    activeTab === 'TO_RECEIVE'
      ? 'REVENUE'
      : activeTab === 'TO_PAY'
      ? 'EXPENSE'
      : filters.type;

  const effectiveStatus =
    activeTab === 'TO_RECEIVE' || activeTab === 'TO_PAY'
      ? 'PENDING'
      : activeTab === 'PAID'
      ? 'PAID'
      : filters.status;

  // Consulta de Transações (Livro-caixa)
  const {
    data: txData,
    isLoading: isTxLoading,
    isError: isTxError,
    error: txError,
    refetch: refetchTx,
  } = useFinancialTransactions({
    page,
    limit,
    search: debouncedSearch,
    type: effectiveType,
    status: effectiveStatus,
    category: filters.category,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const transactions = txData?.data || [];
  const meta = txData?.meta;

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.type !== 'all' ||
      filters.status !== 'all' ||
      filters.category !== 'all' ||
      filters.startDate ||
      filters.endDate ||
      activeTab !== 'ALL'
  );

  const handleTabChange = (tab: QuickTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FinancialFiltersState) => {
    setFilters(newFilters);
    setActiveTab('ALL');
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setActiveTab('ALL');
    setPage(1);
  };

  const handlePayTransaction = async (tx: FinancialTransaction) => {
    try {
      setPayingTxId(tx.id);
      await payMutation.mutateAsync({ id: tx.id });
      toast.success(`Transação "${tx.description}" baixada com sucesso!`);
      refetchTx();
      refetchCashflow();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Erro ao dar baixa na transação.');
    } finally {
      setPayingTxId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Gestão Financeira & Fluxo de Caixa
            </h1>
            <p className="text-xs text-slate-500">
              Painel executivo de tesouraria, controle de contas a pagar e a receber e projeção de liquidez.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTransactionModalOpen(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Alerta de erro se houver */}
      {isCashflowError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              Erro ao carregar dados do fluxo de caixa: {cashflowError?.message || 'Falha de conexão.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetchCashflow()}
            className="flex items-center gap-1 font-semibold underline hover:no-underline ml-4"
          >
            <RefreshCw className="w-3 h-3" /> Tentar Novamente
          </button>
        </div>
      )}

      {/* Grid de KPIs de Liquidez */}
      <FinancialKpiGrid cashflow={cashflowData} isLoading={isCashflowLoading} />

      {/* Gráfico Comparativo Mensal de Fluxo de Caixa */}
      <CashflowChart monthly={cashflowData?.monthly || []} isLoading={isCashflowLoading} />

      {/* Seção do Livro-Caixa e Lançamentos */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              Livro-Caixa & Movimentações
            </h2>
            <p className="text-xs text-slate-500">
              Extrato detalhado de contas pagas, despesas e receitas operacionais.
            </p>
          </div>

          {/* Abas de Acesso Rápido */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('TO_RECEIVE')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'TO_RECEIVE'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              A Receber
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('TO_PAY')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'TO_PAY'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              A Pagar
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('PAID')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'PAID'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Liquidadas
            </button>
          </div>
        </div>

        {/* Filtros da Tabela */}
        <FinancialFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Tratamento de Erro nas Transações */}
        {isTxError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                Ocorreu um erro ao carregar as movimentações: {txError?.message || 'Falha de comunicação.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetchTx()}
              className="flex items-center gap-1 font-semibold underline hover:no-underline ml-4"
            >
              <RefreshCw className="w-3 h-3" /> Tentar Novamente
            </button>
          </div>
        )}

        {/* Tabela de Lançamentos */}
        {isTxLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="w-6 h-6" />}
            title={hasActiveFilters ? 'Nenhuma movimentação encontrada' : 'Livro-caixa vazio'}
            description={
              hasActiveFilters
                ? 'Tente alterar os filtros para visualizar outras movimentações.'
                : 'Clique em "+ Nova Transação" para lançar despesas fixas ou registre pagamentos de faturas.'
            }
          />
        ) : (
          <div className="space-y-4">
            <FinancialTable
              transactions={transactions}
              onPayTransaction={handlePayTransaction}
              payingId={payingTxId}
            />

            {/* Paginação */}
            {meta && meta.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={limit}
                onPageChange={setPage}
                itemName="movimentações"
              />
            )}
          </div>
        )}
      </div>

      {/* Modal de Criação de Transação Avulsa */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={() => {
          refetchTx();
          refetchCashflow();
        }}
      />
    </div>
  );
};
