import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  User,
  Wrench,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Ban,
  DollarSign,
} from 'lucide-react';
import { useInvoice, useCancelInvoice } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/useToast';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { InvoicePrintReceipt } from '@/components/invoices/InvoicePrintReceipt';
import { PaymentModal } from '@/components/financial/PaymentModal';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { maskDocument, maskPhone } from '@/lib/masks';
import type { PaymentMethod } from '@/types';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  CASH: 'Dinheiro',
  BANK_SLIP: 'Boleto Bancário',
};

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(id);
  const cancelInvoiceMutation = useCancelInvoice();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Carregando detalhes da fatura...</p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center my-6">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
        <h3 className="text-base font-bold text-red-800">Fatura não encontrada</h3>
        <p className="text-sm text-red-600 mt-1 mb-4">
          {error?.message || 'A fatura solicitada não foi localizada no sistema.'}
        </p>
        <Link
          to="/invoices"
          className="inline-flex items-center space-x-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Lista de Faturas</span>
        </Link>
      </div>
    );
  }

  const remainingBalance = Math.max(0, invoice.remainingBalance ?? (invoice.netAmount - invoice.paidAmount));
  const canPay = (invoice.status === 'PENDING' || invoice.status === 'PARTIALLY_PAID') && remainingBalance > 0;
  const canCancel = invoice.status === 'PENDING' && (!invoice.payments || invoice.payments.length === 0);

  const items = invoice.workOrder?.items || invoice.quote?.items || [];

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta fatura pendente?')) {
      return;
    }

    try {
      setIsCanceling(true);
      await cancelInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: { reason: 'Cancelado pelo operador no painel de faturas.' },
      });
      toast.success('Fatura cancelada com sucesso.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Erro ao cancelar fatura.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Componente de Impressão (Exibido exclusivamente em window.print()) */}
      <InvoicePrintReceipt invoice={invoice} />

      {/* Interface Interativa da Tela */}
      <div className="print:hidden space-y-6">
        {/* Banner de Status Quitada ou Cancelada */}
        {invoice.status === 'PAID' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Fatura Integralmente Quitada</h4>
              <p className="text-xs text-emerald-700">
                Todos os recebimentos foram computados com sucesso e o saldo devedor está zerado.
              </p>
            </div>
          </div>
        )}

        {invoice.status === 'CANCELED' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">Fatura Cancelada</h4>
              <p className="text-xs text-rose-700">
                Esta cobrança foi cancelada e não aceita mais registros de pagamento.
              </p>
            </div>
          </div>
        )}

        {/* Top Header & Ações */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Voltar para faturas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                  {invoice.invoiceNumber}
                </h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Emitida em {formatDate(invoice.createdAt)} • Vencimento em {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir Fatura / Recibo</span>
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCanceling}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Cancelar Fatura</span>
              </button>
            )}

            {canPay && (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Registrar Pagamento</span>
              </button>
            )}
          </div>
        </div>

        {/* Cards Resumo Financeiro (KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Valor Bruto
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              {formatCurrency(invoice.amount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Desconto Concedido
            </span>
            <span className="text-lg font-bold text-slate-700 mt-1 block">
              {formatCurrency(invoice.discount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider block">
              Valor Total Líquido
            </span>
            <span className="text-lg font-bold text-brand-700 mt-1 block">
              {formatCurrency(invoice.netAmount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Total Quitado
            </span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block">
              {formatCurrency(invoice.paidAmount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Saldo Restante
            </span>
            <span
              className={`text-lg font-bold mt-1 block ${
                remainingBalance > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>

        {/* 2 Cards: Cliente e Origem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Cliente */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dados do Cliente
              </h3>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>
                <strong className="text-slate-800">Nome:</strong> {invoice.customer.name}
              </p>
              <p>
                <strong className="text-slate-800">Documento (CPF/CNPJ):</strong>{' '}
                {invoice.customer.document ? maskDocument(invoice.customer.document) : 'Não informado'}
              </p>
              <p>
                <strong className="text-slate-800">Telefone:</strong> {maskPhone(invoice.customer.phone)}
              </p>
              <p>
                <strong className="text-slate-800">E-mail:</strong> {invoice.customer.email || 'Não informado'}
              </p>
              {invoice.customer.address && (
                <p>
                  <strong className="text-slate-800">Endereço:</strong> {invoice.customer.address}
                </p>
              )}
            </div>
          </div>

          {/* Card Origem do Atendimento */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wrench className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Origem do Atendimento
              </h3>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              {invoice.workOrder ? (
                <>
                  <p className="flex items-center gap-1.5">
                    <strong className="text-slate-800">Ordem de Serviço:</strong>
                    <Link
                      to={`/work-orders/${invoice.workOrder.id}`}
                      className="text-brand-600 font-semibold hover:underline font-mono"
                    >
                      #{invoice.workOrder.orderNumber}
                    </Link>
                  </p>
                  <p>
                    <strong className="text-slate-800">Equipamento:</strong> {invoice.workOrder.equipment}
                  </p>
                  {invoice.workOrder.serialNumber && (
                    <p>
                      <strong className="text-slate-800">Nº de Série:</strong> {invoice.workOrder.serialNumber}
                    </p>
                  )}
                  {invoice.workOrder.technician && (
                    <p>
                      <strong className="text-slate-800">Técnico:</strong> {invoice.workOrder.technician.name}
                    </p>
                  )}
                </>
              ) : invoice.quote ? (
                <>
                  <p className="flex items-center gap-1.5">
                    <strong className="text-slate-800">Orçamento:</strong>
                    <Link
                      to={`/quotes/${invoice.quote.id}`}
                      className="text-brand-600 font-semibold hover:underline font-mono"
                    >
                      {invoice.quote.quoteNumber}
                    </Link>
                  </p>
                  <p>
                    <strong className="text-slate-800">Equipamento:</strong> {invoice.quote.equipment}
                  </p>
                  {invoice.quote.serialNumber && (
                    <p>
                      <strong className="text-slate-800">Nº de Série:</strong> {invoice.quote.serialNumber}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-400 italic">Fatura avulsa gerada manualmente.</p>
              )}

              {invoice.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <strong className="text-slate-800 block mb-0.5">Observações da Fatura:</strong>
                  <p className="text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Itens Faturados */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Itens da Fatura (Peças & Serviços)
              </h3>
              <span className="text-xs text-slate-500">{items.length} item(ns) discriminados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Descrição</th>
                    <th className="px-5 py-3 text-center">Tipo</th>
                    <th className="px-5 py-3 text-center">Quantidade</th>
                    <th className="px-5 py-3 text-right">Valor Unitário</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-medium text-slate-800">{item.description}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            item.type === 'SERVICE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-mono">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(item.subtotal || item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabela de Histórico de Pagamentos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Histórico de Pagamentos & Amortizações
            </h3>
            <span className="text-xs text-slate-500">
              {invoice.payments?.length || 0} pagamento(s) registrado(s)
            </span>
          </div>

          {!invoice.payments || invoice.payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhum pagamento registrado nesta fatura até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Data e Hora</th>
                    <th className="px-5 py-3">Forma de Pagamento</th>
                    <th className="px-5 py-3">Recebido Por</th>
                    <th className="px-5 py-3">Observações</th>
                    <th className="px-5 py-3 text-right">Valor Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-slate-700">
                        {formatDateTime(p.paidAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {paymentMethodLabels[p.paymentMethod] || p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">{p.receivedBy}</td>
                      <td className="px-5 py-3 text-slate-500">{p.notes || '-'}</td>
                      <td className="px-5 py-3 text-right font-bold font-mono text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          remainingBalance={remainingBalance}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
