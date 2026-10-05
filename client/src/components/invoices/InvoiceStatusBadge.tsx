import React from 'react';
import { Badge } from '@/components/common/Badge';
import type { InvoiceStatus } from '@/types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning' }
> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  PARTIALLY_PAID: { label: 'Parcialmente Paga', variant: 'info' },
  PAID: { label: 'Quitada', variant: 'success' },
  CANCELED: { label: 'Cancelada', variant: 'danger' },
};

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, className }) => {
  const config = invoiceStatusConfig[status] || { label: status, variant: 'neutral' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
