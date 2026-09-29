import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight, ArrowRight } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/common/Badge';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useWorkOrders } from '@/hooks/useWorkOrders';

export const RecentWorkOrdersTable: React.FC = () => {
  const { data, isLoading } = useWorkOrders({ limit: 5, page: 1 });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="h-5 w-56 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="p-5 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const orders = data?.data ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-brand-600" />
          Ordens de Serviço Recentes
        </h3>
        <Link
          to="/work-orders"
          className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Nenhuma ordem de serviço cadastrada</p>
          <Link
            to="/work-orders/new"
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Criar primeira ordem →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Protocolo
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Equipamento
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Prioridade
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Data
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/work-orders/${order.id}`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800 truncate max-w-[160px]">
                        {order.customer?.name ?? '—'}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">
                        {order.customer?.phone ?? ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-sm text-slate-700 truncate max-w-[180px]">
                      {order.equipment}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <PriorityBadge priority={order.priority} />
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-medium text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/work-orders/${order.id}`}
                      className="inline-flex items-center text-slate-400 hover:text-brand-600 transition-colors"
                      title="Ver detalhes"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
