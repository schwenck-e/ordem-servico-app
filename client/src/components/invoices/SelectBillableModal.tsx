import React, { useState } from 'react';
import { ClipboardList, FileText, ArrowRight, Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useQuotes } from '@/hooks/useQuotes';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { WorkOrderSummary, QuoteSummary } from '@/types';

interface SelectBillableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkOrder: (order: WorkOrderSummary) => void;
  onSelectQuote: (quote: QuoteSummary) => void;
}

export const SelectBillableModal: React.FC<SelectBillableModalProps> = ({
  isOpen,
  onClose,
  onSelectWorkOrder,
  onSelectQuote,
}) => {
  const [activeTab, setActiveTab] = useState<'WORK_ORDERS' | 'QUOTES'>('WORK_ORDERS');
  const [searchTerm, setSearchTerm] = useState('');

  // Busca ordens de serviço com status COMPLETED
  const { data: woData, isLoading: isLoadingWO } = useWorkOrders({
    status: 'COMPLETED',
    search: searchTerm,
    limit: 30,
  });

  // Busca orçamentos com status APPROVED
  const { data: quoteData, isLoading: isLoadingQuotes } = useQuotes({
    status: 'APPROVED',
    search: searchTerm,
    limit: 30,
  });

  if (!isOpen) return null;

  const completedOrders = woData?.data || [];
  const approvedQuotes = quoteData?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar Documento para Faturamento"
      description="Escolha uma Ordem de Serviço concluída ou Orçamento aprovado para emitir a fatura comercial."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Seletor de Abas */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('WORK_ORDERS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'WORK_ORDERS'
                ? 'border-brand-600 text-brand-700 bg-brand-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Ordens de Serviço Concluídas ({completedOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('QUOTES')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'QUOTES'
                ? 'border-brand-600 text-brand-700 bg-brand-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Orçamentos Aprovados ({approvedQuotes.length})</span>
          </button>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por número ou cliente..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Conteúdo das Abas */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {activeTab === 'WORK_ORDERS' ? (
            isLoadingWO ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600 mb-2" />
                <span>Carregando ordens de serviço concluídas...</span>
              </div>
            ) : completedOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Nenhuma ordem de serviço concluída disponível no momento.
              </div>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">
                        • {order.customer.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Equipamento: {order.equipment}</span>
                      <span>•</span>
                      <span>Concluída em {formatDate(order.completedDate || order.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectWorkOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                    >
                      <span>Faturar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : isLoadingQuotes ? (
            <div className="py-8 flex flex-col items-center justify-center text-xs text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-brand-600 mb-2" />
              <span>Carregando orçamentos aprovados...</span>
            </div>
          ) : approvedQuotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              Nenhum orçamento aprovado disponível no momento.
            </div>
          ) : (
            approvedQuotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {quote.quoteNumber}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                      • {quote.customer.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Equipamento: {quote.equipment}</span>
                    <span>•</span>
                    <span>Criado em {formatDate(quote.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {formatCurrency(quote.totalAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectQuote(quote)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    <span>Faturar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
