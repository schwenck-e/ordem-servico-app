import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Calendar, Receipt, Loader2 } from 'lucide-react';
import {
  TransactionTypeBadge,
  TransactionStatusBadge,
  categoryLabels,
} from '@/components/financial/TransactionStatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { FinancialTransaction } from '@/types';

interface FinancialTableProps {
  transactions: FinancialTransaction[];
  onPayTransaction?: (transaction: FinancialTransaction) => void;
  payingId?: string | null;
}

export const FinancialTable: React.FC<FinancialTableProps> = ({
  transactions,
  onPayTransaction,
  payingId,
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
          <tr>
            <th scope="col" className="px-5 py-3.5">Operação</th>
            <th scope="col" className="px-5 py-3.5">Categoria</th>
            <th scope="col" className="px-5 py-3.5">Descrição</th>
            <th scope="col" className="px-5 py-3.5 text-center">Vencimento</th>
            <th scope="col" className="px-5 py-3.5 text-center">Pagamento</th>
            <th scope="col" className="px-5 py-3.5 text-right">Valor</th>
            <th scope="col" className="px-5 py-3.5 text-center">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {transactions.map((tx) => {
            const isRevenue = tx.type === 'REVENUE';
            const isPending = tx.status === 'PENDING';
            const isCurrentlyPaying = payingId === tx.id;

            return (
              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Tipo */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <TransactionTypeBadge type={tx.type} />
                </td>

                {/* Categoria */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-700">
                    {categoryLabels[tx.category] || tx.category}
                  </span>
                </td>

                {/* Descrição & Vínculo */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-xs truncate max-w-[220px]">
                      {tx.description}
                    </span>
                    {tx.invoice && (
                      <Link
                        to={`/invoices/${tx.invoice.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-600 hover:text-brand-700 hover:underline mt-0.5"
                      >
                        <Receipt className="w-3 h-3 text-slate-400" />
                        Fatura {tx.invoice.invoiceNumber}
                      </Link>
                    )}
                  </div>
                </td>

                {/* Vencimento */}
                <td className="px-5 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(tx.dueDate)}
                  </span>
                </td>

                {/* Data Pagamento */}
                <td className="px-5 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                  {tx.paymentDate ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      {formatDate(tx.paymentDate)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Valor */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isRevenue ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isRevenue ? '+ ' : '- '}
                    {formatCurrency(tx.amount)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <TransactionStatusBadge status={tx.status} />
                </td>

                {/* Ações */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  {isPending && onPayTransaction && (
                    <button
                      type="button"
                      onClick={() => onPayTransaction(tx)}
                      disabled={isCurrentlyPaying}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                      title="Liquidar / Dar Baixa"
                    >
                      {isCurrentlyPaying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Liquidar</span>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
