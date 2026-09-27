import React from 'react';
import { ArrowRightLeft, Eye, Wrench, Calendar } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/common/Badge';
import { maskPhone } from '@/lib/masks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { WorkOrderSummary } from '@/types';

interface WorkOrderTableProps {
  workOrders: WorkOrderSummary[];
  onStatusChange: (order: WorkOrderSummary) => void;
  onView: (order: WorkOrderSummary) => void;
}

export const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  workOrders,
  onStatusChange,
  onView,
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
          <tr>
            <th scope="col" className="px-5 py-3.5">OS</th>
            <th scope="col" className="px-5 py-3.5">Cliente</th>
            <th scope="col" className="px-5 py-3.5">Equipamento & Defeito</th>
            <th scope="col" className="px-5 py-3.5">Técnico</th>
            <th scope="col" className="px-5 py-3.5 text-center">Prioridade</th>
            <th scope="col" className="px-5 py-3.5 text-center">Status</th>
            <th scope="col" className="px-5 py-3.5 text-right">Valor Total</th>
            <th scope="col" className="px-5 py-3.5 text-center">Abertura</th>
            <th scope="col" className="px-5 py-3.5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {workOrders.map((order) => {
            const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELED';

            return (
              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Protocolo */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className="font-mono text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline inline-block"
                  >
                    {order.orderNumber}
                  </button>
                </td>

                {/* Cliente */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                      {order.customer.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {maskPhone(order.customer.phone)}
                    </span>
                  </div>
                </td>

                {/* Equipamento & Defeito */}
                <td className="px-5 py-4 max-w-xs">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 text-xs truncate">
                      {order.equipment}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate" title={order.reportedDefect}>
                      {order.reportedDefect}
                    </span>
                  </div>
                </td>

                {/* Técnico */}
                <td className="px-5 py-4 whitespace-nowrap">
                  {order.technician ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                      <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{order.technician.name}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                      Pendente
                    </span>
                  )}
                </td>

                {/* Prioridade */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <PriorityBadge priority={order.priority} />
                </td>

                {/* Status */}
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <StatusBadge status={order.status} />
                </td>

                {/* Valor Total */}
                <td className="px-5 py-4 text-right font-semibold text-slate-900 text-xs whitespace-nowrap">
                  {formatCurrency(order.totalAmount)}
                </td>

                {/* Data de Abertura */}
                <td className="px-5 py-4 text-center text-xs text-slate-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(order.createdAt)}
                  </span>
                </td>

                {/* Ações */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Botão Alterar Status */}
                    <button
                      type="button"
                      onClick={() => onStatusChange(order)}
                      disabled={isTerminal}
                      title={
                        isTerminal
                          ? `OS em estado terminal (${order.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'})`
                          : 'Alterar status da OS'
                      }
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                        isTerminal
                          ? 'opacity-40 text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50'
                          : 'text-brand-600 hover:text-brand-700 border-brand-200 hover:border-brand-300 bg-brand-50/50 hover:bg-brand-50'
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Status</span>
                    </button>

                    {/* Botão Visualizar Detalhes */}
                    <button
                      type="button"
                      onClick={() => onView(order)}
                      title="Visualizar detalhes da OS"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
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
