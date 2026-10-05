import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Edit2,
  ArrowRightLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  User,
  Wrench,
  Smartphone,
  Stethoscope,
  MessageSquare,
  AlertTriangle,
  Layers,
  Package,
  Receipt,
} from 'lucide-react';
import { useQuote } from '@/hooks/useQuotes';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { QuotePrintReceipt } from '@/components/quotes/QuotePrintReceipt';
import { ConvertQuoteModal } from '@/components/quotes/ConvertQuoteModal';
import { QuoteStatusModal } from '@/components/quotes/QuoteStatusModal';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { maskDocument, maskPhone } from '@/lib/masks';

export const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quote, isLoading, isError, error } = useQuote(id);

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm text-slate-500 font-medium">Carregando detalhes do orçamento...</p>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center my-6">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
        <h3 className="text-base font-bold text-red-800">Orçamento não encontrado</h3>
        <p className="text-sm text-red-600 mt-1 mb-4">
          {error?.message || 'A proposta comercial solicitada não foi localizada no sistema.'}
        </p>
        <Link
          to="/quotes"
          className="inline-flex items-center space-x-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Lista de Orçamentos</span>
        </Link>
      </div>
    );
  }

  const isDraft = quote.status === 'DRAFT';
  const isConverted = Boolean(quote.workOrderId);
  const canConvert = !isConverted && quote.status !== 'REJECTED' && quote.status !== 'EXPIRED';
  const canChangeStatus = !isConverted && quote.status !== 'APPROVED' && quote.status !== 'REJECTED' && quote.status !== 'EXPIRED';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Visualização de Impressão Formal (Exibida somente ao imprimir) */}
      <QuotePrintReceipt quote={quote} />

      {/* Interface Interativa do Sistema (Ocultada na impressão) */}
      <div className="print:hidden space-y-6">
        {/* Banner de OS Vinculada (Se já convertido) */}
        {isConverted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Orçamento Convertido em Ordem de Serviço
                </h4>
                <p className="text-xs text-emerald-700">
                  Este orçamento foi aprovado e gerou uma OS no sistema com baixa de estoque realizada.
                </p>
              </div>
            </div>

            <Link
              to={`/work-orders/${quote.workOrderId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
            >
              <span>Ver Ordem de Serviço</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Top Header & Barra de Ações */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/quotes')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Voltar para orçamentos"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                    {quote.quoteNumber}
                  </h1>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Criado em {formatDate(quote.createdAt)}</span>
                  {quote.validUntil && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Válido até {formatDate(quote.validUntil)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Alterar Status */}
            {canChangeStatus && (
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                <span>Alterar Status</span>
              </button>
            )}

            {/* Editar (DRAFT) */}
            {isDraft && (
              <Link
                to={`/quotes/${quote.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Editar Orçamento</span>
              </Link>
            )}

            {/* Converter em OS */}
            {canConvert && (
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Converter em Ordem de Serviço</span>
              </button>
            )}

            {/* Atalho para Faturas */}
            {(quote.status === 'APPROVED' || isConverted) && (
              <Link
                to={`/invoices?search=${quote.quoteNumber}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                title="Consultar fatura vinculada"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Ver Fatura</span>
              </Link>
            )}
          </div>
        </div>

        {/* Grid 360° de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Cliente */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-800">Dados do Cliente</h3>
              </div>
              <Link
                to={`/customers`}
                className="text-[11px] text-brand-600 hover:underline font-medium"
              >
                Ver Cliente
              </Link>
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nome / Razão Social:</span>
                <span className="font-semibold text-slate-800 text-sm">{quote.customer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Documento:</span>
                <span className="font-mono text-slate-700">
                  {quote.customer.document ? maskDocument(quote.customer.document) : 'Não informado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Telefone / Contato:</span>
                <span className="font-mono text-slate-700">{maskPhone(quote.customer.phone)}</span>
              </div>
              {quote.customer.email && (
                <div>
                  <span className="text-slate-400 block text-[11px]">E-mail:</span>
                  <span className="text-slate-700">{quote.customer.email}</span>
                </div>
              )}
              {quote.customer.address && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Endereço:</span>
                  <span className="text-slate-600">{quote.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Equipamento & Técnico */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Smartphone className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">Equipamento & Avaliação</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Modelo / Aparelho:</span>
                <span className="font-semibold text-slate-800 text-sm">{quote.equipment}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Número de Série / IMEI:</span>
                <span className="font-mono text-slate-700">{quote.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Técnico Avaliador:</span>
                {quote.technician ? (
                  <span className="font-medium text-slate-800 inline-flex items-center gap-1 mt-0.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    {quote.technician.name} ({quote.technician.specialty || 'Geral'})
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Pendente de atribuição</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Prazo de Validade:</span>
                <span className="font-medium text-slate-700">
                  {quote.validUntil ? formatDate(quote.validUntil) : '15 dias'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Resumo Financeiro */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Layers className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">Resumo da Proposta</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Serviços:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(quote.totalServices)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Peças:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(quote.totalParts)}
                </span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Desconto Comercial:</span>
                  <span>-{formatCurrency(quote.discount)}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700">TOTAL PROPOSTA:</span>
                <span className="text-lg font-black text-brand-600">
                  {formatCurrency(quote.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Defeito e Diagnóstico Técnico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Defeito Relatado pelo Cliente</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {quote.reportedDefect}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
              <Stethoscope className="w-4 h-4 text-brand-600" />
              <span>Diagnóstico Técnico Preliminar</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {quote.technicalDiagnosis || 'Nenhum diagnóstico preliminar informado.'}
            </p>
          </div>
        </div>

        {/* Observações Comerciais se houver */}
        {quote.notes && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Condições Comerciais & Observações</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {quote.notes}
            </p>
          </div>
        )}

        {/* Tabela de Itens e Peças */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Itens da Proposta ({quote.items.length})
              </h3>
            </div>
          </div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3">Tipo</th>
                <th scope="col" className="px-5 py-3">Descrição Detalhada</th>
                <th scope="col" className="px-5 py-3 text-center">Quantidade</th>
                <th scope="col" className="px-5 py-3 text-right">Valor Unitário</th>
                <th scope="col" className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {quote.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        item.type === 'SERVICE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {item.type === 'SERVICE' ? 'Serviço' : 'Peça'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800 block">{item.description}</span>
                    {item.product && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        SKU: {item.product.sku} • Estoque atual: {item.product.currentStock} {item.product.unit}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium">{item.quantity}</td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais de Ação */}
      <ConvertQuoteModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        quote={quote}
      />

      <QuoteStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        quote={quote}
      />
    </div>
  );
};
