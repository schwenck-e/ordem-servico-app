import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, CreditCard, Calendar, Wrench, FileText } from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { maskPhone } from '@/lib/masks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { InvoiceSummary } from '@/types';

interface InvoiceTableProps {
  invoices: InvoiceSummary[];
  onOpenPayment?: (invoice: InvoiceSummary) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onOpenPayment }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
          <tr>
            <th scope="col" className="px-5 py-3.5">Fatura</th>
            <th scope="col" className="px-5 py-3.5">Cliente</th>
            <th scope="col" className="px-5 py-3.5">Origem</th>
            <th scope="col" className="px-5 py-3.5 text-center">Vencimento</th>
            <th scope="col" className="px-5 py-3.5 text-right">Valor Total</th>
            <th scope="col" className="px-5 py-3.5 text-right">Valor Pago</th>
            <th scope="col" className="px-5 py-3.5 text-right">Saldo Restante</th>
            <th scope="col" className="px-5 py-3.5 text-center">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoices.map((inv) => {
            const remaining = Math.max(0, inv.netAmount - inv.paidAmount);
            const canPay = (inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID') && remaining > 0;

            return (
              <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Protocolo */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="font-mono text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline inline-block"
                  >
                    {inv.invoiceNumber}
                  </Link>
                </td>

                {/* Cliente */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                      {inv.customer.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {maskPhone(inv.customer.phone)}
                    </span>
                  </div>
                </td>

                {/* Origem */}
                <td className="px-5 py-4 whitespace-nowrap">
                  {inv.workOrder ? (
                    <Link
                      to={`/work-orders/${inv.workOrder.id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      OS #{inv.workOrder.orderNumber}
                    </Link>
                  ) : inv.quoteId ? (
                    <Link
                      to={`/quotes/${inv.quoteId}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Orçamento
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Avulsa</span>
                  )}
                </td>

                {/* Vencimento */}
                <td className="px-5 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(inv.dueDate)}
                  </span>
                </td>

                {/* Valor Total */}
                <td className="px-5 py-4 text-right text-xs font-semibold text-slate-900 whitespace-nowrap">
                  {formatCurrency(inv.netAmount)}
                </td>

                {/* Valor Pago */}
                <td className="px-5 py-4 text-right text-xs font-medium text-emerald-600 whitespace-nowrap">
                  {formatCurrency(inv.paidAmount)}
                </td>

                {/* Saldo Restante */}
                <td className="px-5 py-4 text-right text-xs font-semibold text-slate-700 whitespace-nowrap">
                  {remaining > 0 ? (
                    <span className="text-amber-600">{formatCurrency(remaining)}</span>
                  ) : (
                    <span className="text-slate-400">R$ 0,00</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <InvoiceStatusBadge status={inv.status} />
                </td>

                {/* Ações */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {canPay && onOpenPayment && (
                      <button
                        type="button"
                        onClick={() => onOpenPayment(inv)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                        title="Registrar Pagamento"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                      title="Ver Detalhes da Fatura"
                    >
                      <Eye className="w-4 h-4" />
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
