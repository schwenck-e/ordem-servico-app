import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { CashflowResponse } from '@/types';

interface FinancialKpiGridProps {
  cashflow?: CashflowResponse;
  isLoading?: boolean;
}

export const FinancialKpiGrid: React.FC<FinancialKpiGridProps> = ({ cashflow, isLoading }) => {
  if (isLoading || !cashflow) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-3"
          >
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-7 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const { currentBalance, period } = cashflow;
  const isPositiveBalance = currentBalance >= 0;
  const isPositivePeriod = period.periodBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Saldo Consolidado em Caixa */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Saldo Atual em Caixa
          </span>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isPositiveBalance
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span
            className={`text-2xl font-bold tracking-tight ${
              isPositiveBalance ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(currentBalance)}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Receitas realizadas menos despesas pagas
          </p>
        </div>
      </div>

      {/* 2. Total a Receber no Período */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            A Receber (Período)
          </span>
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-sky-700">
            {formatCurrency(period.totalToReceive)}
          </span>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Realizado: </span>
            <strong className="text-emerald-600">{formatCurrency(period.paidRevenue)}</strong>
          </p>
        </div>
      </div>

      {/* 3. Total a Pagar no Período */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            A Pagar (Período)
          </span>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-amber-700">
            {formatCurrency(period.totalToPay)}
          </span>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Liquidado: </span>
            <strong className="text-rose-600">{formatCurrency(period.paidExpense)}</strong>
          </p>
        </div>
      </div>

      {/* 4. Resultado Líquido do Período */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Resultado do Período
          </span>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isPositivePeriod
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}
          >
            {isPositivePeriod ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <span
            className={`text-2xl font-bold tracking-tight ${
              isPositivePeriod ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(period.periodBalance)}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Receitas realizadas menos despesas quitadas
          </p>
        </div>
      </div>
    </div>
  );
};
