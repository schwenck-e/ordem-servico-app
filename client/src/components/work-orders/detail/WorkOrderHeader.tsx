import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Edit2,
  ArrowRightLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/common/Badge';
import { formatDate } from '@/lib/formatters';
import type { WorkOrder } from '@/types';

interface WorkOrderHeaderProps {
  order: WorkOrder;
  onOpenStatusModal: () => void;
  onPrint: () => void;
}

export const WorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({
  order,
  onOpenStatusModal,
  onPrint,
}) => {
  const navigate = useNavigate();

  const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELED';
  const isOverdue =
    !isTerminal &&
    order.scheduledDate &&
    new Date(order.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/work-orders')}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Ordens</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-slate-800 font-semibold">{order.orderNumber}</span>
        </div>
      </div>

      {/* Main Title & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
          </div>

          {/* Temporal metadata */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5" title="Data de Abertura">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Abertura: <strong>{formatDate(order.createdAt)}</strong></span>
            </div>

            {order.scheduledDate && (
              <div
                className={`flex items-center gap-1.5 ${
                  isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                }`}
                title="Data de Previsão de Conclusão"
              >
                {isOverdue ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  Previsão: <strong>{formatDate(order.scheduledDate)}</strong>
                  {isOverdue && ' (Em atraso)'}
                </span>
              </div>
            )}

            {order.completedDate && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium" title="Data de Conclusão">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Conclusão: <strong>{formatDate(order.completedDate)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400"
            title="Imprimir comprovante formal para cliente ou assistência"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>

          <Link
            to={`/work-orders/${order.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Editar OS</span>
          </Link>

          <button
            type="button"
            onClick={onOpenStatusModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Alterar Status</span>
          </button>
        </div>
      </div>
    </div>
  );
};
