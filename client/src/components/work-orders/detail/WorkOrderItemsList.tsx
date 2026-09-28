import React from 'react';
import { Package, Wrench, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { WorkOrder } from '@/types';

interface WorkOrderItemsListProps {
  order: WorkOrder;
}

export const WorkOrderItemsList: React.FC<WorkOrderItemsListProps> = ({ order }) => {
  const items = order.items || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary-600" />
          <span>Peças, Serviços e Faturamento</span>
        </h2>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Items Table */}
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 w-32">Tipo</th>
                <th scope="col" className="py-3 px-4">Descrição</th>
                <th scope="col" className="py-3 px-4 text-center w-24">Qtd.</th>
                <th scope="col" className="py-3 px-4 text-right w-32">Unitário</th>
                <th scope="col" className="py-3 px-4 text-right w-36">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => {
                const isService = item.type === 'SERVICE';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isService ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                          <Wrench className="w-3 h-3 text-sky-600" />
                          Serviço
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Package className="w-3 h-3 text-emerald-600" />
                          Peça
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 text-sm">
          Nenhum item ou serviço discriminado nesta Ordem de Serviço.
        </div>
      )}

      {/* Financial Summary */}
      <div className="p-5 bg-slate-50/60 border-t border-slate-200">
        <div className="max-w-xs ml-auto space-y-2 text-sm">
          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal de Serviços:</span>
            <span className="font-mono">{formatCurrency(order.totalServices)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal de Peças:</span>
            <span className="font-mono">{formatCurrency(order.totalParts)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between items-center text-rose-600 font-medium">
              <span>Desconto Concedido:</span>
              <span className="font-mono">- {formatCurrency(order.discount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-base font-bold text-slate-900">Total Geral:</span>
            <span className="text-lg font-bold font-mono text-primary-700">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
