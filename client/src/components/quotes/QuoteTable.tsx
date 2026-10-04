import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit2, Wrench, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { maskPhone } from '@/lib/masks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { QuoteSummary } from '@/types';

interface QuoteTableProps {
  quotes: QuoteSummary[];
  onConvert?: (quote: QuoteSummary) => void;
}

export const QuoteTable: React.FC<QuoteTableProps> = ({ quotes, onConvert }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
          <tr>
            <th scope="col" className="px-5 py-3.5">Orçamento</th>
            <th scope="col" className="px-5 py-3.5">Cliente</th>
            <th scope="col" className="px-5 py-3.5">Equipamento & Defeito</th>
            <th scope="col" className="px-5 py-3.5">Técnico</th>
            <th scope="col" className="px-5 py-3.5 text-center">Validade</th>
            <th scope="col" className="px-5 py-3.5 text-center">Status</th>
            <th scope="col" className="px-5 py-3.5 text-center">OS Gerada</th>
            <th scope="col" className="px-5 py-3.5 text-right">Valor Total</th>
            <th scope="col" className="px-5 py-3.5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {quotes.map((quote) => {
            const isDraft = quote.status === 'DRAFT';
            const isConverted = Boolean(quote.workOrderId);
            const canConvert = !isConverted && quote.status !== 'REJECTED' && quote.status !== 'EXPIRED';

            return (
              <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Protocolo */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <Link
                    to={`/quotes/${quote.id}`}
                    className="font-mono text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline inline-block"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>

                {/* Cliente */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                      {quote.customer.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {maskPhone(quote.customer.phone)}
                    </span>
                  </div>
                </td>

                {/* Equipamento & Defeito */}
                <td className="px-5 py-4 max-w-xs">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 text-xs truncate">
                      {quote.equipment}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate" title={quote.reportedDefect}>
                      {quote.reportedDefect}
                    </span>
                  </div>
                </td>

                {/* Técnico */}
                <td className="px-5 py-4 whitespace-nowrap">
                  {quote.technician ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                      <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{quote.technician.name}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                      Pendente
                    </span>
                  )}
                </td>

                {/* Validade */}
                <td className="px-5 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                  {quote.validUntil ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(quote.validUntil)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <QuoteStatusBadge status={quote.status} />
                </td>

                {/* OS Vinculada */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  {isConverted ? (
                    <Link
                      to={`/work-orders/${quote.workOrderId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors"
                      title="Ver Ordem de Serviço vinculada"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ver OS</span>
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>

                {/* Valor Total */}
                <td className="px-5 py-4 text-right font-semibold text-slate-900 text-xs whitespace-nowrap">
                  {formatCurrency(quote.totalAmount)}
                </td>

                {/* Ações */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Ação de converter em OS se aplicável */}
                    {canConvert && onConvert && (
                      <button
                        type="button"
                        onClick={() => onConvert(quote)}
                        title="Converter em Ordem de Serviço"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Gerar OS</span>
                      </button>
                    )}

                    {/* Botão Editar se DRAFT */}
                    {isDraft && (
                      <Link
                        to={`/quotes/${quote.id}/edit`}
                        title="Editar orçamento"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Editar</span>
                      </Link>
                    )}

                    {/* Botão Visualizar Detalhes */}
                    <Link
                      to={`/quotes/${quote.id}`}
                      title="Visualizar detalhes do orçamento"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Ver</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
