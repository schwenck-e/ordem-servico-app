import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { CashflowMonthlyItem } from '@/types';

interface CashflowChartProps {
  monthly: CashflowMonthlyItem[];
  isLoading?: boolean;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatMonthLabel(monthStr: string): string {
  // Format "YYYY-MM"
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    const year = parts[0].slice(2);
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]}/${year}`;
    }
  }
  return monthStr;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ monthly, isLoading }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-56 bg-slate-50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!monthly || monthly.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
          <BarChart3 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700">Sem dados para exibição</h4>
        <p className="text-xs text-slate-500 mt-1">
          Nenhuma movimentação financeira consolidada no período analisado.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...monthly.map((m) => Math.max(m.revenue, m.expense)),
    100
  );

  const chartHeight = 180;
  const chartWidth = 600;
  const paddingX = 40;
  const availableWidth = chartWidth - paddingX * 2;
  const groupWidth = availableWidth / monthly.length;
  const barWidth = Math.min(22, (groupWidth - 16) / 2);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Cabeçalho do Gráfico com Legenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Comparativo Mensal: Receitas vs Despesas
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-slate-600">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span className="text-slate-600">Despesas</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Responsivo */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="w-full h-auto min-w-[500px]"
        >
          {/* Linhas de grade de fundo */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - ratio * chartHeight + 10;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={chartWidth - paddingX + 10}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Grupos de Barras por Mês */}
          {monthly.map((item, idx) => {
            const centerX = paddingX + idx * groupWidth + groupWidth / 2;
            const revHeight = (item.revenue / maxValue) * chartHeight;
            const expHeight = (item.expense / maxValue) * chartHeight;

            const revY = chartHeight - revHeight + 10;
            const expY = chartHeight - expHeight + 10;

            const revX = centerX - barWidth - 2;
            const expX = centerX + 2;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Destaque de hover de fundo */}
                {isHovered && (
                  <rect
                    x={centerX - groupWidth / 2 + 4}
                    y={10}
                    width={groupWidth - 8}
                    height={chartHeight + 25}
                    fill="#f8fafc"
                    rx={6}
                  />
                )}

                {/* Barra de Receita */}
                <rect
                  x={revX}
                  y={revY}
                  width={barWidth}
                  height={Math.max(revHeight, 2)}
                  rx={3}
                  className="fill-emerald-500 hover:fill-emerald-600 transition-colors"
                />

                {/* Barra de Despesa */}
                <rect
                  x={expX}
                  y={expY}
                  width={barWidth}
                  height={Math.max(expHeight, 2)}
                  rx={3}
                  className="fill-rose-500 hover:fill-rose-600 transition-colors"
                />

                {/* Rótulo do Mês */}
                <text
                  x={centerX}
                  y={chartHeight + 28}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {formatMonthLabel(item.month)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Dinâmico Informativo ao passar o mouse */}
        {hoveredIndex !== null && monthly[hoveredIndex] && (
          <div className="mt-2 p-3 bg-slate-900 text-white rounded-lg text-xs flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in fade-in duration-150">
            <span className="font-semibold text-slate-200">
              Mês: {formatMonthLabel(monthly[hoveredIndex].month)}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-medium">
                Receitas: {formatCurrency(monthly[hoveredIndex].revenue)}
              </span>
              <span className="text-rose-400 font-medium">
                Despesas: {formatCurrency(monthly[hoveredIndex].expense)}
              </span>
              <span className="font-bold text-white border-l border-slate-700 pl-4">
                Saldo: {formatCurrency(monthly[hoveredIndex].netBalance)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
