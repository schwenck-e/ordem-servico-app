import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { StatusMetricItem, WorkOrderStatus } from '@/types';

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  OPEN: '#38bdf8',
  IN_PROGRESS: '#f59e0b',
  WAITING_PARTS: '#f97316',
  WAITING_APPROVAL: '#a855f7',
  COMPLETED: '#10b981',
  CANCELED: '#f43f5e',
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  WAITING_PARTS: 'Aguardando Peças',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
};

interface StatusDistributionChartProps {
  data: StatusMetricItem[];
  totalOrders: number;
  loading?: boolean;
}

const RADIUS = 80;
const STROKE_WIDTH = 24;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  data,
  totalOrders,
  loading = false,
}) => {
  const arcs = useMemo(() => {
    if (totalOrders === 0) return [];

    let cumulativeOffset = 0;
    return data
      .filter((item) => item.count > 0)
      .map((item) => {
        const fraction = item.count / totalOrders;
        const dashLength = fraction * CIRCUMFERENCE;
        const arc = {
          status: item.status,
          color: STATUS_COLORS[item.status],
          dasharray: `${dashLength} ${CIRCUMFERENCE - dashLength}`,
          offset: -cumulativeOffset,
          count: item.count,
          percentage: item.percentage,
          totalAmount: item.totalAmount,
        };
        cumulativeOffset += dashLength;
        return arc;
      });
  }, [data, totalOrders]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="flex items-center gap-8">
          <div className="w-[208px] h-[208px] bg-slate-100 rounded-full animate-pulse" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-brand-600" />
        Distribuição por Status
      </h3>

      {totalOrders === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <PieChart className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Nenhuma ordem encontrada neste período</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* SVG Donut */}
          <div className="flex-shrink-0 relative">
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {/* Background circle */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={STROKE_WIDTH}
              />
              {/* Data arcs */}
              {arcs.map((arc) => (
                <circle
                  key={arc.status}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={arc.dasharray}
                  strokeDashoffset={arc.offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  className="transition-all duration-500"
                />
              ))}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-2">
            {data
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.status}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                    <span className="text-xs text-slate-400 ml-1">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <span className="text-xs text-slate-500">{formatCurrency(item.totalAmount)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
