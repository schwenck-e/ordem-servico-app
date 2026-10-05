import React from 'react';
import { Badge } from '@/components/common/Badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type {
  FinancialTransactionType,
  FinancialTransactionStatus,
  FinancialTransactionCategory,
} from '@/types';

export const categoryLabels: Record<FinancialTransactionCategory, string> = {
  FIXED_EXPENSE: 'Despesa Fixa',
  VARIABLE_EXPENSE: 'Despesa Variável',
  PARTS_PURCHASE: 'Compra de Peças',
  SERVICE_REVENUE: 'Receita de Serviços',
  OTHER: 'Outros',
};

interface TransactionTypeBadgeProps {
  type: FinancialTransactionType;
  className?: string;
}

export const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({ type, className }) => {
  if (type === 'REVENUE') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className || ''}`}
      >
        <ArrowUpRight className="w-3 h-3 text-emerald-600" />
        Receita
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className || ''}`}
    >
      <ArrowDownRight className="w-3 h-3 text-rose-600" />
      Despesa
    </span>
  );
};

interface TransactionStatusBadgeProps {
  status: FinancialTransactionStatus;
  className?: string;
}

export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({ status, className }) => {
  const configs: Record<FinancialTransactionStatus, { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' }> = {
    PENDING: { label: 'Pendente', variant: 'warning' },
    PAID: { label: 'Pago / Realizado', variant: 'success' },
    CANCELED: { label: 'Cancelado', variant: 'neutral' },
  };

  const config = configs[status] || { label: status, variant: 'neutral' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
