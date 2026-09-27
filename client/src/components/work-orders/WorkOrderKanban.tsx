import React from 'react';
import { WorkOrderCard } from './WorkOrderCard';
import { formatCurrency } from '@/lib/formatters';
import type { WorkOrderSummary, WorkOrderStatus } from '@/types';

interface WorkOrderKanbanProps {
  workOrders: WorkOrderSummary[];
  onStatusChange: (order: WorkOrderSummary) => void;
  onView: (order: WorkOrderSummary) => void;
}

interface KanbanColumnConfig {
  id: WorkOrderStatus;
  title: string;
  badgeClass: string;
  borderClass: string;
  headerBgClass: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'OPEN',
    title: 'Aberta',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    borderClass: 'border-t-sky-500',
    headerBgClass: 'bg-sky-50/40',
  },
  {
    id: 'IN_PROGRESS',
    title: 'Em Andamento',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    borderClass: 'border-t-amber-500',
    headerBgClass: 'bg-amber-50/40',
  },
  {
    id: 'WAITING_PARTS',
    title: 'Aguardando Peças',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    borderClass: 'border-t-orange-500',
    headerBgClass: 'bg-orange-50/40',
  },
  {
    id: 'WAITING_APPROVAL',
    title: 'Aguardando Aprovação',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    borderClass: 'border-t-purple-500',
    headerBgClass: 'bg-purple-50/40',
  },
  {
    id: 'COMPLETED',
    title: 'Concluída',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderClass: 'border-t-emerald-500',
    headerBgClass: 'bg-emerald-50/40',
  },
  {
    id: 'CANCELED',
    title: 'Cancelada',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    borderClass: 'border-t-rose-500',
    headerBgClass: 'bg-rose-50/40',
  },
];

export const WorkOrderKanban: React.FC<WorkOrderKanbanProps> = ({
  workOrders,
  onStatusChange,
  onView,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x select-none">
      {KANBAN_COLUMNS.map((column) => {
        const columnOrders = workOrders.filter((o) => o.status === column.id);
        const columnTotal = columnOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        return (
          <div
            key={column.id}
            className={`w-72 sm:w-80 shrink-0 bg-slate-100/70 rounded-xl border border-slate-200 border-t-4 ${column.borderClass} flex flex-col max-h-[calc(100vh-250px)] shadow-xs`}
          >
            {/* Column Header */}
            <div
              className={`p-3.5 border-b border-slate-200/80 rounded-t-lg ${column.headerBgClass}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs text-slate-800 tracking-tight">
                    {column.title}
                  </h3>
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full border ${column.badgeClass}`}
                  >
                    {columnOrders.length}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 font-mono">
                  {formatCurrency(columnTotal)}
                </span>
              </div>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5">
              {columnOrders.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200/80 rounded-lg">
                  <p className="text-xs text-slate-400 font-medium">Nenhuma O.S.</p>
                </div>
              ) : (
                columnOrders.map((order) => (
                  <WorkOrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={onStatusChange}
                    onView={onView}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
