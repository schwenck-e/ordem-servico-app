import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Eye, Edit2, User, Wrench, Calendar, Cpu } from 'lucide-react';
import { PriorityBadge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { WorkOrderSummary } from '@/types';

interface WorkOrderCardProps {
  order: WorkOrderSummary;
  onStatusChange: (order: WorkOrderSummary) => void;
  onView: (order: WorkOrderSummary) => void;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
  order,
  onStatusChange,
  onView,
}) => {
  const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELED';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
      {/* Top Header: Order Number and Priority */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onView(order)}
          className="font-mono text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
        >
          {order.orderNumber}
        </button>
        <PriorityBadge priority={order.priority} />
      </div>

      {/* Main Body */}
      <div className="space-y-1.5 text-xs">
        {/* Customer */}
        <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{order.customer.name}</span>
        </div>

        {/* Equipment */}
        <div className="flex items-center gap-1.5 text-slate-700 truncate">
          <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium">{order.equipment}</span>
        </div>

        {/* Reported Defect */}
        <p className="text-slate-500 text-[11px] line-clamp-2 pl-5" title={order.reportedDefect}>
          {order.reportedDefect}
        </p>

        {/* Technician */}
        <div className="flex items-center gap-1.5 text-slate-600 pt-1">
          <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {order.technician ? (
            <span className="text-[11px] truncate text-slate-700">{order.technician.name}</span>
          ) : (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
              Sem técnico
            </span>
          )}
        </div>
      </div>

      {/* Footer: Total and Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-slate-400 block leading-tight">Total</span>
          <span className="text-xs font-bold text-slate-900 leading-tight">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Alterar Status */}
          <button
            type="button"
            onClick={() => onStatusChange(order)}
            disabled={isTerminal}
            title={
              isTerminal
                ? `OS em estado terminal (${order.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'})`
                : 'Alterar status'
            }
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              isTerminal
                ? 'opacity-30 text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50'
                : 'text-brand-600 hover:text-brand-700 bg-brand-50 border-brand-200 hover:bg-brand-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Editar OS */}
          <Link
            to={`/work-orders/${order.id}/edit`}
            title="Editar OS"
            className="p-1.5 rounded-md border text-slate-600 hover:text-indigo-600 bg-white border-slate-200 hover:bg-indigo-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Link>

          {/* Ver Detalhes */}
          <button
            type="button"
            onClick={() => onView(order)}
            title="Ver detalhes"
            className="p-1.5 rounded-md border text-slate-600 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Date Created */}
      <div className="text-[10px] text-slate-400 flex items-center gap-1 -mt-1">
        <Calendar className="w-3 h-3 text-slate-300" />
        <span>Criada em {formatDate(order.createdAt)}</span>
      </div>
    </div>
  );
};
